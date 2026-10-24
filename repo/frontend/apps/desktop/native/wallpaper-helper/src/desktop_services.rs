//! Node-API services backed by Win32 / COM, with blocking work on libuv worker threads.
use napi::{bindgen_prelude::AsyncTask, Env, Result, Task};
use napi_derive::napi;
use std::sync::Mutex;

static WALLPAPER_LOCK: Mutex<()> = Mutex::new(());
static ICON_LOCK: Mutex<()> = Mutex::new(());

#[napi(object)]
pub struct DesktopIconState {
    pub supported: bool,
    pub visible: Option<bool>,
    pub diagnostic: Option<String>,
}

#[napi(object)]
pub struct SystemWallpaperResult {
    pub success: bool,
    pub changed: bool,
    pub error: Option<String>,
}

fn wallpaper_result(result: std::result::Result<bool, String>) -> SystemWallpaperResult {
    match result {
        Ok(changed) => SystemWallpaperResult {
            success: true,
            changed,
            error: None,
        },
        Err(error) => SystemWallpaperResult {
            success: false,
            changed: false,
            error: Some(error),
        },
    }
}

#[cfg_attr(not(windows), allow(dead_code))]
enum Operation {
    Apply(String, String),
    Restore(String),
}

fn operate(operation: &Operation) -> SystemWallpaperResult {
    let result = (|| {
        let _lock = WALLPAPER_LOCK
            .lock()
            .map_err(|_| "Wallpaper transaction lock poisoned".to_string())?;
        #[cfg(windows)]
        {
            let desktop = crate::windows_desktop::WindowsDesktop::new()?;
            match operation {
                Operation::Apply(image, journal) => {
                    crate::system_wallpaper::apply(&desktop, image.as_ref(), journal.as_ref())
                }
                Operation::Restore(journal) => {
                    crate::system_wallpaper::restore(&desktop, journal.as_ref())
                }
            }
        }
        #[cfg(not(windows))]
        {
            let _ = operation;
            Err("Static wallpaper fallback requires Windows".to_string())
        }
    })();
    wallpaper_result(result)
}

pub struct WallpaperTask {
    operation: Operation,
}
impl Task for WallpaperTask {
    type Output = SystemWallpaperResult;
    type JsValue = SystemWallpaperResult;
    fn compute(&mut self) -> Result<Self::Output> {
        Ok(operate(&self.operation))
    }
    fn resolve(&mut self, _: Env, result: Self::Output) -> Result<Self::JsValue> {
        Ok(result)
    }
}

pub struct IconTask {
    visible: Option<bool>,
}
impl Task for IconTask {
    type Output = DesktopIconState;
    type JsValue = DesktopIconState;
    fn compute(&mut self) -> Result<Self::Output> {
        let result = (|| {
            let _lock = ICON_LOCK
                .lock()
                .map_err(|_| "Desktop icon lock poisoned".to_string())?;
            #[cfg(windows)]
            return crate::windows_desktop::desktop_icons(self.visible);
            #[cfg(not(windows))]
            {
                let _ = self.visible;
                Err("Desktop icon control requires Windows Explorer".to_string())
            }
        })();
        Ok(match result {
            Ok(visible) => DesktopIconState {
                supported: true,
                visible: Some(visible),
                diagnostic: None,
            },
            Err(error) => DesktopIconState {
                supported: false,
                visible: None,
                diagnostic: Some(error),
            },
        })
    }
    fn resolve(&mut self, _: Env, result: Self::Output) -> Result<Self::JsValue> {
        Ok(result)
    }
}

#[napi]
pub fn get_desktop_icon_visibility() -> AsyncTask<IconTask> {
    AsyncTask::new(IconTask { visible: None })
}

#[napi]
pub fn set_desktop_icon_visibility(visible: bool) -> AsyncTask<IconTask> {
    AsyncTask::new(IconTask {
        visible: Some(visible),
    })
}

#[napi]
pub fn apply_system_wallpaper(
    image_path: String,
    journal_path: String,
) -> AsyncTask<WallpaperTask> {
    AsyncTask::new(WallpaperTask {
        operation: Operation::Apply(image_path, journal_path),
    })
}

#[napi]
pub fn restore_system_wallpaper(journal_path: String) -> AsyncTask<WallpaperTask> {
    AsyncTask::new(WallpaperTask {
        operation: Operation::Restore(journal_path),
    })
}

#[napi]
pub fn restore_system_wallpaper_sync(journal_path: String) -> SystemWallpaperResult {
    operate(&Operation::Restore(journal_path))
}
