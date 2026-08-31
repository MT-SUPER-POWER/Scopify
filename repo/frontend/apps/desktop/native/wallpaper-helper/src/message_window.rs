// packaging/windows/wallpaper-helper/src/message_window.rs
// Hidden top-level message window of the resident helper. It is a real (never shown) window
// rather than an HWND_MESSAGE message-only window because broadcast messages — most importantly
// TaskbarCreated after an explorer restart — are not delivered to message-only windows.
// WM_TIMER (heartbeat) and WM_CLOSE (detach request) are routed from here.

use std::sync::atomic::{AtomicIsize, AtomicU32, Ordering};

use windows::core::{s, w};
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::UI::WindowsAndMessaging::{
    CreateWindowExA, DefWindowProcA, DestroyWindow, DispatchMessageW, GetMessageW, PostQuitMessage,
    RegisterClassA, RegisterWindowMessageW, TranslateMessage, MSG, WINDOW_STYLE, WM_CLOSE,
    WM_DESTROY, WM_TIMER, WNDCLASSA,
};

static MESSAGE_HWND: AtomicIsize = AtomicIsize::new(0);
static TASKBAR_CREATED_MSG: AtomicU32 = AtomicU32::new(0);

// Timer ids dispatched to their owners in window_proc.
pub const HEARTBEAT_TIMER_ID: usize = 1;

pub fn hwnd() -> Option<HWND> {
    let value = MESSAGE_HWND.load(Ordering::Relaxed);
    if value == 0 {
        None
    } else {
        Some(HWND(value as _))
    }
}

pub fn taskbar_created_msg() -> u32 {
    TASKBAR_CREATED_MSG.load(Ordering::Relaxed)
}

/// Creates the hidden message window. Must run on the thread that later pumps messages.
pub unsafe fn create() -> Result<(), String> {
    let h_instance =
        GetModuleHandleW(None).map_err(|err| format!("GetModuleHandleW failed: {err}"))?;

    let wnd_class = WNDCLASSA {
        lpfnWndProc: Some(window_proc),
        hInstance: h_instance.into(),
        lpszClassName: s!("ScopifyWallpaperHelperWindow"),
        ..WNDCLASSA::default()
    };
    RegisterClassA(&wnd_class);
    TASKBAR_CREATED_MSG.store(
        RegisterWindowMessageW(w!("TaskbarCreated")),
        Ordering::Relaxed,
    );

    let hwnd = CreateWindowExA(
        Default::default(),
        wnd_class.lpszClassName,
        s!("ScopifyWallpaperHelper"),
        WINDOW_STYLE::default(),
        0,
        0,
        0,
        0,
        None,
        None,
        Some(h_instance.into()),
        None,
    )
    .map_err(|err| format!("message window creation failed: {err}"))?;
    MESSAGE_HWND.store(hwnd.0 as isize, Ordering::Relaxed);
    Ok(())
}

/// Blocks pumping messages until PostQuitMessage (WM_CLOSE / detach).
pub unsafe fn run_message_loop() {
    let mut msg = MSG::default();
    while GetMessageW(&mut msg, None, 0, 0).as_bool() {
        let _ = TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }
}

unsafe extern "system" fn window_proc(
    hwnd: HWND,
    msg: u32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    match msg {
        WM_TIMER => match w_param.0 {
            HEARTBEAT_TIMER_ID => crate::monitor::on_timer(),
            _ => {}
        },
        msg if msg != 0 && msg == taskbar_created_msg() => {
            crate::monitor::on_taskbar_created();
        }
        WM_CLOSE => {
            // Detach request from the stdin reader: restore the window before quitting.
            crate::handle_detach_request();
            let _ = DestroyWindow(hwnd);
            return LRESULT(0);
        }
        WM_DESTROY => {
            PostQuitMessage(0);
        }
        _ => {}
    }
    DefWindowProcA(hwnd, msg, w_param, l_param)
}
