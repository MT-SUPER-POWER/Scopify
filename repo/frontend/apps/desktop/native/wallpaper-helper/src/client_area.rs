//! Keep the existing Electron Renderer alive while its HWND is a borderless desktop child.
//! Electron caches thickFrame at construction; clearing WS_THICKFRAME alone does not stop
//! its WM_NCCALCSIZE handler from subtracting the old frame insets (Folia recreates its window).
use std::sync::atomic::{AtomicIsize, Ordering};
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::System::Threading::GetCurrentThreadId;
use windows::Win32::UI::Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass};
use windows::Win32::UI::WindowsAndMessaging::{
    GetWindowLongPtrW, GetWindowThreadProcessId, IsWindow, GWL_STYLE, WM_NCCALCSIZE,
    WM_NCDESTROY, WS_CHILDWINDOW,
};

const SUBCLASS_ID: usize = 0x53435059;
static WINDOW: AtomicIsize = AtomicIsize::new(0);

// SetWindowSubclass must run on the HWND's owner thread. Call only from synchronous
// Node-API entrypoints on Electron Main, never from the wallpaper monitor thread.
pub fn install(address: isize) -> Result<(), String> {
    unsafe {
        let hwnd = HWND(address as _);
        if GetWindowThreadProcessId(hwnd, None) != GetCurrentThreadId() {
            return Err("Wallpaper client area must be installed on the window's UI thread".into());
        }
        remove()?;
        if !SetWindowSubclass(hwnd, Some(window_proc), SUBCLASS_ID, 0).as_bool() {
            return Err("Could not install wallpaper client-area handling".into());
        }
        WINDOW.store(address, Ordering::SeqCst);
    }
    Ok(())
}

pub fn remove() -> Result<(), String> {
    let address = WINDOW.load(Ordering::SeqCst);
    if address == 0 {
        return Ok(());
    }
    unsafe {
        let hwnd = HWND(address as _);
        if IsWindow(Some(hwnd)).as_bool() {
            if GetWindowThreadProcessId(hwnd, None) != GetCurrentThreadId() {
                return Err("Wallpaper client area must be removed on the window's UI thread".into());
            }
            if !RemoveWindowSubclass(hwnd, Some(window_proc), SUBCLASS_ID).as_bool() {
                return Err("Could not remove wallpaper client-area handling".into());
            }
        }
    }
    WINDOW.compare_exchange(address, 0, Ordering::SeqCst, Ordering::SeqCst).ok();
    Ok(())
}

unsafe extern "system" fn window_proc(
    hwnd: HWND,
    message: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    _id: usize,
    _data: usize,
) -> LRESULT {
    if message == WM_NCCALCSIZE
        && (GetWindowLongPtrW(hwnd, GWL_STYLE) as u32 & WS_CHILDWINDOW.0) != 0
    {
        // Preserve the proposed full-window RECT. Windows then gives Chromium the entire
        // desktop surface, with no hard-coded pixels, DPI assumptions or oversized HWND.
        return LRESULT(0);
    }
    if message == WM_NCDESTROY {
        let _ = RemoveWindowSubclass(hwnd, Some(window_proc), SUBCLASS_ID);
        WINDOW.compare_exchange(hwnd.0 as isize, 0, Ordering::SeqCst, Ordering::SeqCst).ok();
    }
    DefSubclassProc(hwnd, message, wparam, lparam)
}
