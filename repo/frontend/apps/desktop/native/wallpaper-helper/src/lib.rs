//! One Node-API contract for macOS NSWindow and Windows WorkerW wallpaper sessions.
//! Called only by Electron Main, behind the existing authorized Renderer IPC handlers.

#[cfg(windows)]
mod attach;
mod desktop_services;
mod events;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(windows)]
mod message_window;
#[cfg(windows)]
mod monitor;
#[cfg(any(windows, test))]
mod system_wallpaper;
#[cfg(windows)]
mod windows_desktop;
#[cfg(windows)]
mod windows_session;

use napi::{bindgen_prelude::Buffer, Error, Result};
use napi_derive::napi;
use std::sync::atomic::{AtomicBool, Ordering};

pub(crate) static DETACH_REQUESTED: AtomicBool = AtomicBool::new(false);
static SESSION_BUSY: AtomicBool = AtomicBool::new(false);
static ATTACHED: AtomicBool = AtomicBool::new(false);

fn decode_handle(bytes: &[u8]) -> Result<usize> {
    let address = match bytes.len() {
        8 => u64::from_le_bytes(bytes.try_into().unwrap()) as usize,
        4 if cfg!(windows) => u32::from_le_bytes(bytes.try_into().unwrap()) as usize,
        _ => return Err(Error::from_reason("Invalid native window handle length")),
    };
    if address == 0 || (cfg!(target_os = "macos") && address % std::mem::align_of::<usize>() != 0) {
        return Err(Error::from_reason("Invalid native window handle"));
    }
    Ok(address)
}

#[napi(js_name = "attach")]
pub fn attach_wallpaper(
    handle: Buffer,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    primary_height: f64,
) -> Result<()> {
    let address = decode_handle(&handle)?;
    if ![x, y, width, height, primary_height]
        .iter()
        .all(|v| v.is_finite())
        || width <= 0.0
        || height <= 0.0
    {
        return Err(Error::from_reason("Invalid wallpaper display bounds"));
    }
    if SESSION_BUSY.swap(true, Ordering::SeqCst) {
        return Err(Error::from_reason(
            "A wallpaper session is already active or stopping",
        ));
    }
    DETACH_REQUESTED.store(false, Ordering::SeqCst);
    events::clear();
    #[cfg(target_os = "macos")]
    let result = macos::attach(handle, x, y, width, height, primary_height);
    #[cfg(windows)]
    let result = windows_session::start(address as isize);
    #[cfg(not(any(windows, target_os = "macos")))]
    let result = Err(Error::from_reason(
        "Desktop wallpaper requires Windows or macOS",
    ));
    let _ = address;
    if result.is_err() {
        SESSION_BUSY.store(false, Ordering::SeqCst);
    }
    result
}

#[napi(js_name = "detach")]
pub fn detach_wallpaper() -> Result<()> {
    DETACH_REQUESTED.store(true, Ordering::SeqCst);
    #[cfg(target_os = "macos")]
    macos::detach()?;
    #[cfg(windows)]
    windows_session::request_detach()?;
    Ok(())
}

#[napi]
pub fn poll_events() -> Vec<String> {
    events::drain()
}

#[napi]
pub fn is_attached() -> bool {
    #[cfg(target_os = "macos")]
    return macos::is_attached();
    #[cfg(not(target_os = "macos"))]
    ATTACHED.load(Ordering::SeqCst)
}

pub(crate) fn session_finished() {
    ATTACHED.store(false, Ordering::SeqCst);
    SESSION_BUSY.store(false, Ordering::SeqCst);
}

#[cfg(windows)]
pub(crate) fn handle_detach_request() {
    windows_session::finish();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_invalid_native_handles_before_dereferencing() {
        assert!(decode_handle(&[]).is_err());
        assert!(decode_handle(&[0; 8]).is_err());
        assert_eq!(decode_handle(&4096u64.to_le_bytes()).unwrap(), 4096);
        #[cfg(target_os = "macos")]
        assert!(decode_handle(&1u64.to_le_bytes()).is_err());
    }
}
