//! Journaled static-wallpaper transactions, shared with tests and compatible with PS Version 1 journals.
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
};

pub type Result<T> = std::result::Result<T, String>;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct Monitor {
    pub index: u32,
    pub monitor_id: String,
    pub wallpaper_path: String,
    #[serde(default)]
    pub backup_path: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct Snapshot {
    pub background_color: u32,
    pub has_composite_state: bool,
    #[serde(default)]
    pub has_slideshow: bool,
    pub monitors: Vec<Monitor>,
    pub position: i32,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
struct Journal {
    version: u32,
    applied_image_path: String,
    original_state: Snapshot,
}

pub trait Desktop {
    fn probe(&self) -> Result<Snapshot>;
    fn set_wallpaper(&self, path: &str) -> Result<()>;
    fn set_position(&self, position: i32) -> Result<()>;
    fn set_color(&self, color: u32) -> Result<()>;
}

fn error(value: impl std::fmt::Display) -> String {
    value.to_string()
}
fn same_path(a: &str, b: &str) -> bool {
    fn normalize(value: &str) -> String {
        let path = value.replace('\\', "/");
        let path = path.strip_prefix("//?/").unwrap_or(&path);
        if path
            .get(..4)
            .is_some_and(|prefix| prefix.eq_ignore_ascii_case("UNC/"))
        {
            format!("//{}", &path[4..])
        } else {
            path.to_owned()
        }
    }
    normalize(a).eq_ignore_ascii_case(&normalize(b))
}

fn wait_for_wallpaper(desktop: &impl Desktop, expected: &str) -> Result<()> {
    for _ in 0..20 {
        let current = desktop.probe()?;
        if current.monitors.len() == 1 && same_path(&current.monitors[0].wallpaper_path, expected) {
            return Ok(());
        }
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    Err("Windows did not confirm the requested wallpaper".into())
}

pub fn apply(desktop: &impl Desktop, image: &Path, journal_path: &Path) -> Result<bool> {
    if journal_path.exists() {
        return Err("A wallpaper recovery journal already exists".into());
    }
    let image = fs::canonicalize(image).map_err(error)?;
    if !image.is_file() {
        return Err("Wallpaper image is not a file".into());
    }
    let mut original = desktop.probe()?;
    if original.monitors.len() != 1 || original.has_composite_state || original.has_slideshow {
        return Err("Static fallback requires a single monitor without a slideshow".into());
    }
    let directory = journal_path
        .parent()
        .ok_or("Recovery journal has no directory")?;
    fs::create_dir_all(directory).map_err(error)?;
    let directory = fs::canonicalize(directory).map_err(error)?;
    for monitor in &mut original.monitors {
        if monitor.wallpaper_path.is_empty() {
            continue;
        }
        let original_path = Path::new(&monitor.wallpaper_path);
        let transcoded = std::env::var_os("APPDATA")
            .map(|root| PathBuf::from(root).join("Microsoft/Windows/Themes/TranscodedWallpaper"));
        let source = if original_path.is_file() {
            original_path
        } else {
            transcoded
                .as_deref()
                .filter(|path| path.is_file())
                .ok_or("The original wallpaper cannot be backed up")?
        };
        let extension = source.extension().and_then(|v| v.to_str()).unwrap_or("jpg");
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(error)?
            .as_nanos();
        let backup = directory.join(format!(
            "original-wallpaper-{}-{stamp}.{extension}",
            monitor.index
        ));
        fs::copy(source, &backup).map_err(error)?;
        monitor.backup_path = backup.to_string_lossy().into_owned();
    }
    let journal = Journal {
        version: 1,
        applied_image_path: image.to_string_lossy().into_owned(),
        original_state: original,
    };
    // Persist and flush before touching Windows. create_new protects an existing recovery record.
    let bytes = serde_json::to_vec(&journal).map_err(error)?;
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(journal_path)
        .map_err(error)?;
    if let Err(failure) = file.write_all(&bytes).and_then(|_| file.sync_all()) {
        drop(file);
        let _ = fs::remove_file(journal_path);
        cleanup_backups(&journal, &directory, None);
        return Err(error(failure));
    }
    drop(file);
    let applied = desktop
        .set_position(4)
        .and_then(|_| desktop.set_wallpaper(&journal.applied_image_path))
        .and_then(|_| wait_for_wallpaper(desktop, &journal.applied_image_path));
    if let Err(failure) = applied {
        // Roll back even when setting the image failed after setting its presentation mode.
        return match restore_record(desktop, journal_path, &journal, true) {
            Ok(_) => Err(failure),
            Err(recovery) => Err(format!("{failure}; recovery retained: {recovery}")),
        };
    }
    Ok(true)
}

pub fn restore(desktop: &impl Desktop, journal_path: &Path) -> Result<bool> {
    if !journal_path.exists() {
        return Ok(false);
    }
    let bytes = fs::read(journal_path).map_err(error)?;
    let journal: Journal = serde_json::from_slice(&bytes).map_err(error)?;
    if journal.version != 1
        || journal.original_state.monitors.len() != 1
        || !(0..=5).contains(&journal.original_state.position)
    {
        return Err("Unsupported wallpaper recovery journal".into());
    }
    restore_record(desktop, journal_path, &journal, false)
}

fn restore_record(
    desktop: &impl Desktop,
    path: &Path,
    journal: &Journal,
    rollback: bool,
) -> Result<bool> {
    let current = desktop.probe()?;
    let original = &journal.original_state.monitors[0];
    let matching_display =
        current.monitors.len() == 1 && current.monitors[0].monitor_id == original.monitor_id;
    if !matching_display {
        // A disconnected / replaced display may return. Keep recovery instead of discarding it.
        return Err("Wallpaper display changed; recovery journal retained".into());
    }
    let current_path = &current.monitors[0].wallpaper_path;
    let owns_image = same_path(current_path, &journal.applied_image_path);
    let owns_partial = same_path(current_path, &original.wallpaper_path)
        && (rollback
            || (current.position == 4
                && current.background_color == journal.original_state.background_color));
    let owns_style = rollback
        || (current.position == 4
            && current.background_color == journal.original_state.background_color);
    if !current.has_slideshow
        && !current.has_composite_state
        && (owns_image || owns_partial)
        && owns_style
    {
        let restore_path = if original.wallpaper_path.is_empty()
            || Path::new(&original.wallpaper_path).is_file()
        {
            &original.wallpaper_path
        } else if Path::new(&original.backup_path).is_file() {
            &original.backup_path
        } else {
            return Err("Neither the original wallpaper nor its backup exists".into());
        };
        desktop.set_wallpaper(restore_path)?;
        desktop.set_position(journal.original_state.position)?;
        desktop.set_color(journal.original_state.background_color)?;
        wait_for_wallpaper(desktop, restore_path)?;
        // A backup used as the active wallpaper must remain on disk after recovery.
        let directory = path.parent().ok_or("Recovery journal has no directory")?;
        cleanup_backups(journal, directory, Some(restore_path));
        fs::remove_file(path).map_err(error)?;
        return Ok(true);
    }
    // The user selected another wallpaper / presentation. Never overwrite that choice.
    cleanup_backups(
        journal,
        path.parent().ok_or("Recovery journal has no directory")?,
        Some(current_path),
    );
    fs::remove_file(path).map_err(error)?;
    Ok(false)
}

fn cleanup_backups(journal: &Journal, directory: &Path, keep: Option<&str>) {
    let Ok(directory) = fs::canonicalize(directory) else {
        return;
    };
    for monitor in &journal.original_state.monitors {
        if keep.is_some_and(|path| same_path(path, &monitor.backup_path)) {
            continue;
        }
        let backup = Path::new(&monitor.backup_path);
        let local = backup
            .parent()
            .and_then(|path| fs::canonicalize(path).ok())
            .is_some_and(|parent| parent == directory);
        let named_backup = backup
            .file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.starts_with("original-wallpaper-"));
        if local && named_backup {
            let _ = fs::remove_file(backup);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::{Cell, RefCell};
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct FakeDesktop {
        state: RefCell<Snapshot>,
        fail_next_image: Cell<bool>,
    }
    impl Desktop for FakeDesktop {
        fn probe(&self) -> Result<Snapshot> {
            Ok(self.state.borrow().clone())
        }
        fn set_wallpaper(&self, path: &str) -> Result<()> {
            if self.fail_next_image.replace(false) {
                return Err("simulated Windows failure".into());
            }
            self.state.borrow_mut().monitors[0].wallpaper_path = path.into();
            Ok(())
        }
        fn set_position(&self, position: i32) -> Result<()> {
            self.state.borrow_mut().position = position;
            Ok(())
        }
        fn set_color(&self, color: u32) -> Result<()> {
            self.state.borrow_mut().background_color = color;
            Ok(())
        }
    }

    struct Fixture {
        root: PathBuf,
        journal: PathBuf,
        image: PathBuf,
        original: PathBuf,
        desktop: FakeDesktop,
    }
    impl Fixture {
        fn new() -> Self {
            static SERIAL: AtomicUsize = AtomicUsize::new(0);
            let root = std::env::temp_dir().join(format!(
                "scopify-wallpaper-{}-{}",
                std::process::id(),
                SERIAL.fetch_add(1, Ordering::SeqCst)
            ));
            fs::create_dir_all(&root).unwrap();
            let original = root.join("original.png");
            let image = root.join("generated.png");
            fs::write(&original, b"original image").unwrap();
            fs::write(&image, b"generated image").unwrap();
            let desktop = FakeDesktop {
                state: RefCell::new(Snapshot {
                    background_color: 123,
                    position: 2,
                    has_composite_state: false,
                    has_slideshow: false,
                    monitors: vec![Monitor {
                        index: 0,
                        monitor_id: "display-1".into(),
                        wallpaper_path: original.to_string_lossy().into_owned(),
                        backup_path: String::new(),
                    }],
                }),
                fail_next_image: Cell::new(false),
            };
            Self {
                journal: root.join("system-wallpaper-journal.json"),
                root,
                image,
                original,
                desktop,
            }
        }
        fn apply(&self) {
            assert!(apply(&self.desktop, &self.image, &self.journal).unwrap());
        }
        fn record(&self) -> Journal {
            serde_json::from_slice(&fs::read(&self.journal).unwrap()).unwrap()
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }

    #[test]
    fn restores_original_image_position_color_and_removes_completed_journal() {
        let f = Fixture::new();
        f.apply();
        let backup = f.record().original_state.monitors[0].backup_path.clone();
        assert!(restore(&f.desktop, &f.journal).unwrap());
        let state = f.desktop.probe().unwrap();
        assert_eq!(state.position, 2);
        assert_eq!(state.background_color, 123);
        assert_eq!(
            state.monitors[0].wallpaper_path,
            f.original.to_string_lossy()
        );
        assert!(!f.journal.exists());
        assert!(!Path::new(&backup).exists());
    }

    #[test]
    fn keeps_a_backup_when_it_becomes_the_active_wallpaper() {
        let f = Fixture::new();
        f.apply();
        let backup = f.record().original_state.monitors[0].backup_path.clone();
        fs::remove_file(&f.original).unwrap();
        assert!(restore(&f.desktop, &f.journal).unwrap());
        assert_eq!(
            f.desktop.probe().unwrap().monitors[0].wallpaper_path,
            backup
        );
        assert_eq!(fs::read(backup).unwrap(), b"original image");
        assert!(!f.journal.exists());
    }

    #[test]
    fn preserves_a_wallpaper_or_position_changed_by_the_user() {
        for change_image in [true, false] {
            let f = Fixture::new();
            f.apply();
            if change_image {
                f.desktop.state.borrow_mut().monitors[0].wallpaper_path =
                    "user-selected.png".into();
            } else {
                f.desktop.state.borrow_mut().position = 1;
            }
            let before = f.desktop.probe().unwrap();
            assert!(!restore(&f.desktop, &f.journal).unwrap());
            let after = f.desktop.probe().unwrap();
            assert_eq!(
                after.monitors[0].wallpaper_path,
                before.monitors[0].wallpaper_path
            );
            assert_eq!(after.position, before.position);
            assert!(!f.journal.exists());
        }
    }

    #[test]
    fn rolls_back_position_when_applying_the_image_fails() {
        let f = Fixture::new();
        f.desktop.fail_next_image.set(true);
        assert!(apply(&f.desktop, &f.image, &f.journal).is_err());
        assert_eq!(f.desktop.probe().unwrap().position, 2);
        assert!(!f.journal.exists());
    }

    #[test]
    fn retains_recovery_after_a_failed_restore_and_allows_retry() {
        let f = Fixture::new();
        f.apply();
        f.desktop.fail_next_image.set(true);
        assert!(restore(&f.desktop, &f.journal).is_err());
        assert!(f.journal.exists());
        assert!(restore(&f.desktop, &f.journal).unwrap());
    }

    #[test]
    fn refuses_slideshow_and_multiple_displays_without_changing_windows() {
        for slideshow in [true, false] {
            let f = Fixture::new();
            if slideshow {
                f.desktop.state.borrow_mut().has_slideshow = true;
            } else {
                let monitor = f.desktop.probe().unwrap().monitors[0].clone();
                f.desktop.state.borrow_mut().monitors.push(monitor);
            }
            assert!(apply(&f.desktop, &f.image, &f.journal).is_err());
            assert!(!f.journal.exists());
            assert_eq!(f.desktop.probe().unwrap().position, 2);
        }
    }

    #[test]
    fn accepts_legacy_powershell_version_one_journals() {
        let f = Fixture::new();
        let backup = f.root.join("original-wallpaper-0.png");
        fs::copy(&f.original, &backup).unwrap();
        fs::remove_file(&f.original).unwrap();
        let journal = serde_json::json!({ "Version": 1, "AppliedImagePath": f.image,
            "OriginalState": { "BackgroundColor": 123, "HasCompositeState": false, "Position": 2,
                "Monitors": [{ "Index": 0, "MonitorId": "display-1", "WallpaperPath": f.original, "BackupPath": backup }] } });
        fs::write(&f.journal, serde_json::to_vec(&journal).unwrap()).unwrap();
        f.desktop.state.borrow_mut().monitors[0].wallpaper_path =
            f.image.to_string_lossy().into_owned();
        f.desktop.state.borrow_mut().position = 4;
        assert!(restore(&f.desktop, &f.journal).unwrap());
        assert!(backup.exists());
    }

    #[test]
    fn retains_a_journal_if_the_original_monitor_is_unavailable() {
        let f = Fixture::new();
        f.apply();
        f.desktop.state.borrow_mut().monitors[0].monitor_id = "display-2".into();
        assert!(restore(&f.desktop, &f.journal).is_err());
        assert!(f.journal.exists());
    }

    #[test]
    fn compares_win32_extended_and_regular_paths() {
        assert!(same_path(
            r"\\?\C:\Users\Test\壁纸.png",
            r"c:\users\test\壁纸.png"
        ));
        assert!(same_path(
            r"\\?\UNC\server\share\a.png",
            r"\\server\share\A.png"
        ));
    }
}
