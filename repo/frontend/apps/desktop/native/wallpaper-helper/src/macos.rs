//! AppKit backend. All calls stay on Electron's AppKit main thread.
use super::*;
use objc2::{msg_send, rc::Retained, runtime::AnyObject, MainThreadMarker};
use objc2_foundation::{NSPoint, NSRect, NSSize};
use std::cell::RefCell;

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGWindowLevelForKey(key: i32) -> i32;
}

struct Session {
    window: Retained<AnyObject>,
    level: isize,
    behavior: usize,
    style: usize,
    ignores_mouse: bool,
    shadow: bool,
}

thread_local! { static SESSION: RefCell<Option<Session>> = const { RefCell::new(None) }; }

fn main_thread() -> Result<()> {
    MainThreadMarker::new()
        .ok_or_else(|| Error::from_reason("Wallpaper operations require the AppKit main thread"))?;
    Ok(())
}

pub fn attach(
    handle: Buffer,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    primary_height: f64,
) -> Result<()> {
    main_thread()?;
    unsafe {
        // Main is the only caller and obtains the handle directly from BrowserWindow.
        let view = decode_handle(&handle)? as *mut AnyObject;
        let ptr: *mut AnyObject = msg_send![view, window];
        let window =
            Retained::retain(ptr).ok_or_else(|| Error::from_reason("NSView has no NSWindow"))?;
        let session = Session {
            level: msg_send![&*window, level],
            behavior: msg_send![&*window, collectionBehavior],
            style: msg_send![&*window, styleMask],
            ignores_mouse: msg_send![&*window, ignoresMouseEvents],
            shadow: msg_send![&*window, hasShadow],
            window,
        };
        // Below Finder icons, above the system wallpaper. No full-screen Space or NSApp
        // presentation options are changed; menu bar / Dock retain their system behavior.
        let desktop_level = CGWindowLevelForKey(18) - 1;
        let w = &*session.window;
        let _: () = msg_send![w, setStyleMask: 0usize];
        let _: () = msg_send![w, setCollectionBehavior: 1usize | (1 << 4) | (1 << 6) | (1 << 8)];
        let _: () = msg_send![w, setLevel: desktop_level as isize];
        let _: () = msg_send![w, setIgnoresMouseEvents: true];
        let _: () = msg_send![w, setHasShadow: false];
        // Electron uses top-left coordinates; AppKit's origin is the primary screen's bottom-left.
        let frame = NSRect::new(
            NSPoint::new(x, primary_height - y - height),
            NSSize::new(width, height),
        );
        let _: () = msg_send![w, setFrame: frame, display: true];
        SESSION.with(|cell| *cell.borrow_mut() = Some(session));
        crate::events::emit(&crate::events::Event::Attached {
            hwnd: 0,
            workerw: 0,
            mode: "macos-desktop",
        });
    }
    Ok(())
}

pub fn detach() -> Result<()> {
    main_thread()?;
    SESSION.with(|cell| {
        if let Some(session) = cell.borrow_mut().take() {
            unsafe {
                let w = &*session.window;
                let _: () = msg_send![w, setStyleMask: session.style];
                let _: () = msg_send![w, setCollectionBehavior: session.behavior];
                let _: () = msg_send![w, setLevel: session.level];
                let _: () = msg_send![w, setIgnoresMouseEvents: session.ignores_mouse];
                let _: () = msg_send![w, setHasShadow: session.shadow];
            }
        }
    });
    crate::session_finished();
    crate::events::emit(&crate::events::Event::Detached { hwnd: 0 });
    Ok(())
}

pub fn is_attached() -> bool {
    if main_thread().is_err() {
        return false;
    }
    SESSION.with(|cell| {
        cell.borrow().as_ref().is_some_and(|session| unsafe {
            let actual: isize = msg_send![&*session.window, level];
            actual == (CGWindowLevelForKey(18) - 1) as isize
        })
    })
}
