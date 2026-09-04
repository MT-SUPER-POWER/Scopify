use std::{sync::Arc, time::Duration};

use parking_lot::Mutex;
use rodio::{OutputStream, Sink};

use crate::bindings::{JsNativeAudioFailure, JsNativeAudioSnapshot};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum PlaybackPhase {
    Ended,
    Error,
    Idle,
    Loading,
    Paused,
    Playing,
    Stopped,
}

impl PlaybackPhase {
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::Ended => "ended",
            Self::Error => "error",
            Self::Idle => "idle",
            Self::Loading => "loading",
            Self::Paused => "paused",
            Self::Playing => "playing",
            Self::Stopped => "stopped",
        }
    }
}

/// A load has a Session-supplied `loadId` plus this native token. The token
/// changes for every load and stop, which makes a late monitor event from an
/// older sink impossible to attach to the current queue item.
pub(crate) struct ActivePlayback {
    // Rodio stops playback when either of these is dropped. Both must therefore
    // stay in Main-owned state for the complete active load.
    pub(crate) _output_stream: OutputStream,
    pub(crate) sink: Arc<Sink>,
}

impl ActivePlayback {
    pub(crate) fn cancel(&self) {
        self.sink.stop();
    }

    pub(crate) fn position_ms(&self) -> f64 {
        self.sink.get_pos().as_secs_f64() * 1_000.0
    }

    pub(crate) fn set_playing(&self, playing: bool) {
        if playing {
            self.sink.play();
        } else {
            self.sink.pause();
        }
    }

    pub(crate) fn set_volume(&self, volume: f64) {
        self.sink.set_volume(volume as f32);
    }

    pub(crate) fn seek(&self, position_ms: f64) -> Result<(), ()> {
        self.sink
            .try_seek(Duration::from_secs_f64(position_ms / 1_000.0))
            .map_err(|_| ())
    }
}

pub(crate) struct PlayerState {
    pub(crate) active: Option<ActivePlayback>,
    pub(crate) duration_ms: f64,
    pub(crate) error: Option<JsNativeAudioFailure>,
    pub(crate) load_id: Option<String>,
    pub(crate) phase: PlaybackPhase,
    pub(crate) position_ms: f64,
    pub(crate) token: Option<u32>,
    pub(crate) next_token: u32,
    pub(crate) volume: f64,
}

impl Default for PlayerState {
    fn default() -> Self {
        Self {
            active: None,
            duration_ms: 0.0,
            error: None,
            load_id: None,
            phase: PlaybackPhase::Idle,
            position_ms: 0.0,
            token: None,
            next_token: 0,
            volume: 1.0,
        }
    }
}

impl PlayerState {
    pub(crate) fn reserve_load(&mut self, load_id: String) -> u32 {
        self.cancel_active();
        self.next_token = self.next_token.wrapping_add(1).max(1);
        self.load_id = Some(load_id);
        self.phase = PlaybackPhase::Loading;
        self.position_ms = 0.0;
        self.duration_ms = 0.0;
        self.error = None;
        self.token = Some(self.next_token);
        self.next_token
    }

    pub(crate) fn install_active(
        &mut self,
        token: u32,
        active: ActivePlayback,
        duration_ms: f64,
    ) -> bool {
        if self.token != Some(token) {
            active.cancel();
            return false;
        }
        active.set_volume(self.volume);
        active.set_playing(false);
        self.duration_ms = duration_ms;
        self.active = Some(active);
        self.phase = PlaybackPhase::Paused;
        true
    }

    pub(crate) fn invalidate_active(&mut self) {
        self.cancel_active();
        self.next_token = self.next_token.wrapping_add(1).max(1);
        self.token = Some(self.next_token);
    }

    pub(crate) fn set_failure(&mut self, message: &str) {
        if let Some(active) = &self.active {
            active.set_playing(false);
        }
        self.error = Some(JsNativeAudioFailure {
            kind: if message.starts_with("[output]") {
                "output".to_string()
            } else if message.starts_with("[decode]") {
                "decode".to_string()
            } else {
                "source".to_string()
            },
            message: message.to_string(),
            retryable: true,
        });
        self.phase = PlaybackPhase::Error;
    }

    pub(crate) fn snapshot(&self) -> JsNativeAudioSnapshot {
        let position_ms = self
            .active
            .as_ref()
            .map_or(self.position_ms, ActivePlayback::position_ms)
            .min(self.duration_ms.max(0.0));
        JsNativeAudioSnapshot {
            duration_ms: self.duration_ms,
            error: self.error.clone(),
            load_id: self.load_id.clone(),
            phase: self.phase.as_str().to_string(),
            position_ms,
            token: self.token,
            volume: self.volume,
        }
    }

    fn cancel_active(&mut self) {
        if let Some(active) = self.active.take() {
            active.cancel();
        }
    }
}

pub(crate) type SharedPlayerState = Mutex<PlayerState>;

#[cfg(test)]
mod tests {
    use super::{PlaybackPhase, PlayerState};

    #[test]
    fn each_load_and_stop_invalidates_the_previous_native_token() {
        let mut player = PlayerState::default();
        let first = player.reserve_load("session-load".to_string());
        let second = player.reserve_load("session-load".to_string());
        player.invalidate_active();

        assert_ne!(first, second);
        assert_ne!(player.token, Some(second));
        assert_eq!(player.phase, PlaybackPhase::Loading);
        assert_eq!(player.snapshot().load_id.as_deref(), Some("session-load"));
    }
}
