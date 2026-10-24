//! WorkerW backend. The existing attach / recovery implementation runs on an owned message thread.
use super::*;
use crate::events::Event;
use windows::Win32::Foundation::{HWND, LPARAM, WPARAM};
use windows::Win32::UI::WindowsAndMessaging::{DestroyWindow, PostMessageW, WM_CLOSE};

pub fn start(address: isize) -> Result<()> {
    std::thread::Builder::new()
        .name("wallpaper-workerw".into())
        .spawn(move || unsafe {
            let hwnd = HWND(address as _);
            let result = (|| -> std::result::Result<(), String> {
                message_window::create()?;
                if DETACH_REQUESTED.load(Ordering::SeqCst) {
                    return Ok(());
                }
                let (worker_w, mode) = attach::attach_window(hwnd)?;
                if let Err(error) = monitor::start(hwnd, worker_w, true) {
                    let _ = attach::detach_window(hwnd);
                    return Err(error);
                }
                if DETACH_REQUESTED.load(Ordering::SeqCst) {
                    finish();
                    return Ok(());
                }
                events::emit(&Event::Attached {
                    hwnd: address,
                    workerw: worker_w.0 as isize,
                    mode: mode.as_str(),
                });
                message_window::run_message_loop();
                Ok(())
            })();
            if let Err(message) = result {
                events::emit(&Event::Error {
                    message,
                    kind: None,
                });
            }
            monitor::stop();
            if let Some(window) = message_window::hwnd() {
                let _ = DestroyWindow(window);
            }
            session_finished();
            events::emit(&Event::Detached { hwnd: address });
        })
        .map_err(|error| Error::from_reason(error.to_string()))?;
    Ok(())
}

pub fn request_detach() -> Result<()> {
    // A startup cancellation is also observed before attach and before starting the loop.
    if let Some(hwnd) = message_window::hwnd() {
        unsafe { PostMessageW(Some(hwnd), WM_CLOSE, WPARAM::default(), LPARAM::default()) }
            .map_err(|error| Error::from_reason(error.to_string()))?;
    }
    Ok(())
}

pub fn finish() {
    DETACH_REQUESTED.store(true, Ordering::SeqCst);
    unsafe {
        // Join reattachment before restoring, so it cannot re-parent the restored window.
        monitor::stop();
        if let Some(address) = monitor::resident_folia_hwnd() {
            if let Err(message) = attach::detach_window(HWND(address as _)) {
                events::emit(&Event::Error {
                    message,
                    kind: None,
                });
            }
        }
        if let Some(address) = monitor::resident_worker_w() {
            attach::invalidate_window(HWND(address as _));
        }
    }
}
