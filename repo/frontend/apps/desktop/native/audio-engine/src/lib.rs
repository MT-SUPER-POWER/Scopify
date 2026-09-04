//! Scopify's NAPI boundary for the Windows audio decoder/output engine.
//!
//! The module deliberately owns decoding and operating-system output only.
//! Queue selection, authentication and renderer state stay above this boundary
//! in the shared PlaybackSession and platform adapter layers.

mod bindings;
mod decoder;
mod error;
mod player;
mod source;

pub use bindings::*;
