use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Weak,
    },
    thread,
    time::Duration,
};

use napi::bindgen_prelude::*;
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi_derive::napi;
use parking_lot::Mutex;
use rodio::{OutputStreamBuilder, Sink};

use crate::{
    decoder::{open, DecodeFailure, DecodedSource},
    error::{error, EngineErrorKind},
    player::{ActivePlayback, PlaybackPhase, SharedPlayerState},
    source::AudioSource,
};

#[napi(object)]
#[derive(Clone)]
pub struct JsNativeAudioFailure {
    pub kind: String,
    pub message: String,
    pub retryable: bool,
}

#[napi(object)]
#[derive(Clone)]
pub struct JsNativeAudioSnapshot {
    pub duration_ms: f64,
    pub error: Option<JsNativeAudioFailure>,
    pub load_id: Option<String>,
    pub phase: String,
    pub position_ms: f64,
    pub token: Option<u32>,
    pub volume: f64,
}

#[napi(object)]
pub struct JsNativeAudioSource {
    pub kind: String,
    pub value: String,
}

#[napi(object)]
pub struct JsNativeAudioLoadRequest {
    pub load_id: String,
    pub source: JsNativeAudioSource,
}

#[napi(object)]
pub struct JsNativeAudioEvent {
    #[napi(js_name = "type")]
    pub event_type: String,
    pub snapshot: JsNativeAudioSnapshot,
}

#[napi(object)]
pub struct JsNativeAudioEngineInfo {
    pub diagnostic: String,
    pub ready: bool,
}

type EventCallback =
    ThreadsafeFunction<JsNativeAudioEvent, (), JsNativeAudioEvent, napi::Status, false>;

/// Event fan-out is separate from the NAPI object so monitor and OS-output
/// threads cannot access JavaScript except through a non-blocking callback.
#[derive(Clone)]
pub(crate) struct EventDispatcher {
    callback: Arc<Mutex<Option<Arc<EventCallback>>>>,
}

impl EventDispatcher {
    pub(crate) fn empty() -> Self {
        Self {
            callback: Arc::new(Mutex::new(None)),
        }
    }

    pub(crate) fn set(&self, callback: Arc<EventCallback>) {
        *self.callback.lock() = Some(callback);
    }

    pub(crate) fn clear(&self) {
        *self.callback.lock() = None;
    }

    pub(crate) fn emit(&self, event_type: &str, snapshot: JsNativeAudioSnapshot) {
        let callback = self.callback.lock().clone();
        if let Some(callback) = callback {
            callback.call(
                JsNativeAudioEvent {
                    event_type: event_type.to_string(),
                    snapshot,
                },
                ThreadsafeFunctionCallMode::NonBlocking,
            );
        }
    }
}

#[napi]
pub struct NativeAudioPlayer {
    disposed: Arc<AtomicBool>,
    events: EventDispatcher,
    state: Arc<SharedPlayerState>,
}

#[napi]
impl NativeAudioPlayer {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            disposed: Arc::new(AtomicBool::new(false)),
            events: EventDispatcher::empty(),
            state: Arc::new(SharedPlayerState::default()),
        }
    }

    /// Electron Main is the sole listener and fans out only safe data to IPC.
    #[napi(ts_args_type = "listener: (event: JsNativeAudioEvent) => void")]
    pub fn on_event(&self, listener: Function<JsNativeAudioEvent, ()>) -> Result<()> {
        self.ensure_live()?;
        self.events
            .set(Arc::new(listener.build_threadsafe_function().build()?));
        Ok(())
    }

    #[napi]
    pub fn get_snapshot(&self) -> JsNativeAudioSnapshot {
        self.state.lock().snapshot()
    }

    /// `async` gives HTTPS I/O an NAPI worker thread. The token is reserved
    /// before opening the source, so a slower older request cannot commit after
    /// a later load begins.
    #[napi]
    pub async fn load(&self, request: JsNativeAudioLoadRequest) -> Result<JsNativeAudioSnapshot> {
        self.ensure_live()?;
        let source = AudioSource::from_js(&request.source)?;
        if request.load_id.is_empty() || request.load_id.len() > 128 {
            return Err(error(
                EngineErrorKind::Source,
                "loadId must be a non-empty identifier no longer than 128 characters.",
            ));
        }

        let token = self.state.lock().reserve_load(request.load_id);
        let decoded = open(&source).map_err(|failure| self.fail_load(token, failure))?;
        self.install_and_monitor(token, decoded)
    }

    #[napi]
    pub fn play(&self) -> Result<()> {
        self.ensure_live()?;
        let snapshot = {
            let mut state = self.state.lock();
            let Some(active) = state.active.as_ref() else {
                return Err(error(
                    EngineErrorKind::Source,
                    "No native audio source is loaded.",
                ));
            };
            active.set_playing(true);
            state.phase = PlaybackPhase::Playing;
            state.snapshot()
        };
        self.events.emit("stateChanged", snapshot);
        Ok(())
    }

    #[napi]
    pub fn pause(&self) -> Result<()> {
        self.ensure_live()?;
        let snapshot = {
            let mut state = self.state.lock();
            let Some(active) = state.active.as_ref() else {
                return Err(error(
                    EngineErrorKind::Source,
                    "No native audio source is loaded.",
                ));
            };
            active.set_playing(false);
            state.phase = PlaybackPhase::Paused;
            state.snapshot()
        };
        self.events.emit("stateChanged", snapshot);
        Ok(())
    }

    #[napi]
    pub fn stop(&self) -> Result<()> {
        self.ensure_live()?;
        let snapshot = {
            let mut state = self.state.lock();
            state.invalidate_active();
            state.phase = PlaybackPhase::Stopped;
            state.position_ms = 0.0;
            state.error = None;
            state.snapshot()
        };
        self.events.emit("stateChanged", snapshot);
        Ok(())
    }

    #[napi]
    pub fn seek(&self, position_ms: f64) -> Result<JsNativeAudioSnapshot> {
        self.ensure_live()?;
        if !position_ms.is_finite() || position_ms < 0.0 {
            return Err(error(
                EngineErrorKind::Source,
                "positionMs must be a finite non-negative number.",
            ));
        }
        let snapshot = {
            let mut state = self.state.lock();
            let target = if state.duration_ms > 0.0 {
                position_ms.min(state.duration_ms)
            } else {
                position_ms
            };
            let Some(active) = state.active.as_ref() else {
                return Err(error(
                    EngineErrorKind::Source,
                    "No native audio source is loaded.",
                ));
            };
            active.seek(target).map_err(|_| {
                error(
                    EngineErrorKind::Decode,
                    "The native audio source does not support seeking.",
                )
            })?;
            state.position_ms = target;
            state.snapshot()
        };
        self.events.emit("stateChanged", snapshot.clone());
        Ok(snapshot)
    }

    #[napi]
    pub fn set_volume(&self, volume: f64) -> Result<()> {
        self.ensure_live()?;
        if !volume.is_finite() || !(0.0..=1.0).contains(&volume) {
            return Err(error(
                EngineErrorKind::Output,
                "volume must be a finite number between 0 and 1.",
            ));
        }
        let snapshot = {
            let mut state = self.state.lock();
            state.volume = volume;
            if let Some(active) = &state.active {
                active.set_volume(volume);
            }
            state.snapshot()
        };
        self.events.emit("stateChanged", snapshot);
        Ok(())
    }

    #[napi]
    pub fn dispose(&self) {
        if self.disposed.swap(true, Ordering::AcqRel) {
            return;
        }
        {
            let mut state = self.state.lock();
            state.invalidate_active();
            state.phase = PlaybackPhase::Stopped;
        }
        self.events.clear();
    }

    fn install_and_monitor(
        &self,
        token: u32,
        decoded: DecodedSource,
    ) -> Result<JsNativeAudioSnapshot> {
        let output_error_state = Arc::downgrade(&self.state);
        let output_error_events = self.events.clone();
        let output_stream = OutputStreamBuilder::from_default_device()
            .and_then(|builder| {
                builder
                    .with_error_callback(move |_| {
                        emit_output_failure(token, &output_error_state, &output_error_events);
                    })
                    .open_stream()
            })
            .map_err(|_| self.fail_output_load(token))?;
        let sink = Arc::new(Sink::connect_new(output_stream.mixer()));
        sink.append(decoded.decoder);
        sink.pause();
        let duration_ms = decoded
            .duration
            .map_or(0.0, |duration| duration.as_secs_f64() * 1_000.0);
        let active = ActivePlayback {
            _output_stream: output_stream,
            sink: sink.clone(),
        };
        let snapshot = {
            let mut state = self.state.lock();
            if !state.install_active(token, active, duration_ms) {
                return Err(error(
                    EngineErrorKind::Source,
                    "The native load was superseded.",
                ));
            }
            state.snapshot()
        };
        spawn_monitor(
            token,
            sink,
            Arc::downgrade(&self.state),
            self.events.clone(),
        );
        self.events.emit("loaded", snapshot.clone());
        Ok(snapshot)
    }

    fn fail_load(&self, token: u32, failure: DecodeFailure) -> napi::Error {
        let snapshot = {
            let mut state = self.state.lock();
            if state.token != Some(token) {
                return error(EngineErrorKind::Source, "The native load was superseded.");
            }
            state.set_failure(failure.message());
            state.snapshot()
        };
        self.events.emit("sourceError", snapshot);
        match failure {
            DecodeFailure::Decode => error(
                EngineErrorKind::Decode,
                "The native audio source could not be decoded.",
            ),
            DecodeFailure::Source => error(
                EngineErrorKind::Source,
                "The native audio source could not be opened.",
            ),
        }
    }

    fn fail_output_load(&self, token: u32) -> napi::Error {
        let snapshot = {
            let mut state = self.state.lock();
            if state.token != Some(token) {
                return error(EngineErrorKind::Source, "The native load was superseded.");
            }
            state.set_failure("[output] The Windows audio output is unavailable.");
            state.snapshot()
        };
        self.events.emit("outputFailed", snapshot);
        error(
            EngineErrorKind::Output,
            "The Windows audio output is unavailable.",
        )
    }

    fn ensure_live(&self) -> Result<()> {
        if self.disposed.load(Ordering::Acquire) {
            Err(error(
                EngineErrorKind::Source,
                "The native audio player is disposed.",
            ))
        } else {
            Ok(())
        }
    }
}

fn spawn_monitor(
    token: u32,
    sink: Arc<Sink>,
    state: Weak<SharedPlayerState>,
    events: EventDispatcher,
) {
    thread::spawn(move || loop {
        let Some(shared_state) = state.upgrade() else {
            return;
        };
        let (snapshot, event_type, current) = {
            let mut player = shared_state.lock();
            if player.token != Some(token) {
                return;
            }
            if sink.empty() {
                player.phase = PlaybackPhase::Ended;
                (player.snapshot(), "ended", true)
            } else if sink.is_paused() {
                (player.snapshot(), "position", false)
            } else {
                (player.snapshot(), "position", true)
            }
        };
        if current {
            events.emit(event_type, snapshot);
        }
        if event_type == "ended" {
            return;
        }
        thread::sleep(Duration::from_millis(250));
    });
}

fn emit_output_failure(token: u32, state: &Weak<SharedPlayerState>, events: &EventDispatcher) {
    let Some(state) = state.upgrade() else {
        return;
    };
    let snapshot = {
        let mut player = state.lock();
        if player.token != Some(token) {
            return;
        }
        player.set_failure("[output] The Windows audio output is unavailable.");
        player.snapshot()
    };
    events.emit("outputFailed", snapshot);
}

#[napi]
pub fn create_native_audio_player() -> NativeAudioPlayer {
    NativeAudioPlayer::new()
}

#[napi]
pub fn get_native_audio_engine_info() -> JsNativeAudioEngineInfo {
    JsNativeAudioEngineInfo {
        diagnostic: "Native audio decoder and Windows output are ready.".to_string(),
        ready: true,
    }
}
