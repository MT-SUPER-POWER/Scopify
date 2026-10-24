//! Windows desktop services: direct Win32 icon control and IDesktopWallpaper COM calls.
use crate::system_wallpaper::{Desktop, Monitor, Result, Snapshot};
use windows::{
    core::{w, Interface, BOOL, PCWSTR, PWSTR},
    Win32::{
        Foundation::{COLORREF, HWND, LPARAM, RPC_E_CHANGED_MODE, WPARAM},
        System::Com::{
            CoCreateInstance, CoInitializeEx, CoTaskMemFree, CoUninitialize, CLSCTX_ALL,
            COINIT_APARTMENTTHREADED,
        },
        UI::{
            Shell::{
                DesktopWallpaper, IDesktopWallpaper, DESKTOP_WALLPAPER_POSITION, DSS_SLIDESHOW,
            },
            WindowsAndMessaging::{
                EnumWindows, FindWindowExW, FindWindowW, IsWindowVisible, SendMessageTimeoutW,
                SMTO_ABORTIFHUNG, WM_COMMAND,
            },
        },
    },
};

struct Apartment {
    initialized: bool,
}
impl Apartment {
    fn new() -> Result<Self> {
        let result = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };
        if result.is_err() && result != RPC_E_CHANGED_MODE {
            return Err(result.to_string());
        }
        Ok(Self {
            initialized: result.is_ok(),
        })
    }
}
impl Drop for Apartment {
    fn drop(&mut self) {
        if self.initialized {
            unsafe {
                CoUninitialize();
            }
        }
    }
}

pub struct WindowsDesktop {
    desktop: IDesktopWallpaper,
    // Drop the COM interface before balancing this thread's apartment initialization.
    _apartment: Apartment,
}
impl WindowsDesktop {
    pub fn new() -> Result<Self> {
        let apartment = Apartment::new()?;
        let desktop = unsafe { CoCreateInstance(&DesktopWallpaper, None, CLSCTX_ALL) }
            .map_err(|error| error.to_string())?;
        Ok(Self {
            desktop,
            _apartment: apartment,
        })
    }
}

fn wide(value: &str) -> Result<Vec<u16>> {
    if value.contains('\0') {
        return Err("A Windows path contains a NUL byte".into());
    }
    Ok(value.encode_utf16().chain(Some(0)).collect())
}

unsafe fn allocated_string(value: PWSTR) -> Result<String> {
    if value.is_null() {
        return Ok(String::new());
    }
    let result = value.to_string().map_err(|error| error.to_string());
    CoTaskMemFree(Some(value.0.cast()));
    result
}

impl Desktop for WindowsDesktop {
    fn probe(&self) -> Result<Snapshot> {
        unsafe {
            let count = self
                .desktop
                .GetMonitorDevicePathCount()
                .map_err(|e| e.to_string())?;
            let mut monitors = Vec::new();
            for index in 0..count {
                let id = allocated_string(
                    self.desktop
                        .GetMonitorDevicePathAt(index)
                        .map_err(|e| e.to_string())?,
                )?;
                let id_wide = wide(&id)?;
                let image = allocated_string(
                    self.desktop
                        .GetWallpaper(PCWSTR(id_wide.as_ptr()))
                        .map_err(|e| e.to_string())?,
                )?;
                monitors.push(Monitor {
                    index,
                    monitor_id: id,
                    wallpaper_path: image,
                    backup_path: String::new(),
                });
            }
            // The generated convenience method discards S_FALSE; retain it to detect composite state.
            let mut global = PWSTR::null();
            let status = (self.desktop.vtable().GetWallpaper)(
                self.desktop.as_raw(),
                PCWSTR::null(),
                &mut global,
            );
            let _ = allocated_string(global)?;
            status.ok().map_err(|e| e.to_string())?;
            Ok(Snapshot {
                background_color: self
                    .desktop
                    .GetBackgroundColor()
                    .map_err(|e| e.to_string())?
                    .0,
                position: self.desktop.GetPosition().map_err(|e| e.to_string())?.0,
                has_composite_state: status.0 == 1,
                has_slideshow: self.desktop.GetStatus().map_err(|e| e.to_string())?.0
                    & DSS_SLIDESHOW.0
                    != 0,
                monitors,
            })
        }
    }
    fn set_wallpaper(&self, path: &str) -> Result<()> {
        let path = wide(path)?;
        unsafe {
            self.desktop.SetWallpaper(
                PCWSTR::null(),
                if path.len() == 1 {
                    PCWSTR::null()
                } else {
                    PCWSTR(path.as_ptr())
                },
            )
        }
        .map_err(|e| e.to_string())
    }
    fn set_position(&self, position: i32) -> Result<()> {
        unsafe {
            self.desktop
                .SetPosition(DESKTOP_WALLPAPER_POSITION(position))
        }
        .map_err(|e| e.to_string())
    }
    fn set_color(&self, color: u32) -> Result<()> {
        unsafe { self.desktop.SetBackgroundColor(COLORREF(color)) }.map_err(|e| e.to_string())
    }
}

unsafe extern "system" fn find_def_view(top: HWND, context: LPARAM) -> BOOL {
    if let Ok(found) = FindWindowExW(Some(top), None, w!("SHELLDLL_DefView"), None) {
        *(context.0 as *mut HWND) = found;
        return BOOL(0);
    }
    BOOL(1)
}

pub fn desktop_icons(requested: Option<bool>) -> Result<bool> {
    unsafe {
        let mut def_view = HWND::default();
        if let Ok(progman) = FindWindowW(w!("Progman"), None) {
            if let Ok(found) = FindWindowExW(Some(progman), None, w!("SHELLDLL_DefView"), None) {
                def_view = found;
            }
        }
        if def_view.is_invalid() {
            // An early-stop callback makes EnumWindows return an error; the captured HWND is authoritative.
            let _ = EnumWindows(
                Some(find_def_view),
                LPARAM((&mut def_view as *mut HWND) as isize),
            );
        }
        if def_view.is_invalid() {
            return Err("Explorer desktop view was not found".into());
        }
        let list = FindWindowExW(Some(def_view), None, w!("SysListView32"), None)
            .map_err(|_| "Explorer desktop icon list was not found".to_string())?;
        let current = IsWindowVisible(list).as_bool();
        let Some(visible) = requested else {
            return Ok(current);
        };
        if visible == current {
            return Ok(current);
        }
        let delivered = SendMessageTimeoutW(
            def_view,
            WM_COMMAND,
            WPARAM(0x7402),
            LPARAM(0),
            SMTO_ABORTIFHUNG,
            1000,
            None,
        );
        if delivered.0 == 0 {
            return Err("Explorer did not accept the icon visibility command".into());
        }
        for _ in 0..30 {
            if IsWindowVisible(list).as_bool() == visible {
                return Ok(visible);
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
        Err("Explorer did not reach the requested icon visibility state".into())
    }
}
