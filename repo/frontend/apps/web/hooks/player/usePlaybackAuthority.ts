"use client";

import { useEffect, useRef, useState } from "react";

import { PLAYBACK_VOLUME_MAX } from "@mt-super-power/desktop-contract";

import { PlaybackAuthority } from "@/lib/playbackProjection/authority";
import type {
  PlaybackAuthorityCallbacks,
  PlaybackAuthorityMediaEvent,
  PlaybackAuthorityScheduler,
  PlaybackMediaPort,
  UsePlaybackAuthorityOptions,
} from "@/types/playbackAuthority";
import type { PlaybackClock } from "@/types/playbackProjection";

const browserClock: PlaybackClock = {
  nowMs: () => Date.now(),
};

const browserScheduler: PlaybackAuthorityScheduler = {
  clearInterval: (handle) => globalThis.clearInterval(handle as ReturnType<typeof setInterval>),
  setInterval: (callback, intervalMs) => globalThis.setInterval(callback, intervalMs),
};

const MEDIA_EVENT_MAP: ReadonlyArray<
  readonly [keyof HTMLMediaElementEventMap, PlaybackAuthorityMediaEvent]
> = [
  ["loadstart", "load-start"],
  ["playing", "playing"],
  ["pause", "pause"],
  ["waiting", "waiting"],
  ["stalled", "waiting"],
  ["canplay", "can-play"],
  ["ended", "ended"],
  ["error", "error"],
  ["durationchange", "duration-change"],
  ["loadedmetadata", "duration-change"],
  ["ratechange", "rate-change"],
];

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function createHtmlAudioPlaybackMediaPort(
  audio: HTMLAudioElement,
  acceptEvent?: (event: PlaybackAuthorityMediaEvent) => boolean,
): PlaybackMediaPort {
  return {
    getSample: () => ({
      durationMs: finiteNonNegative(audio.duration * 1_000),
      ended: audio.ended,
      errorMessage: audio.error?.message ?? null,
      paused: audio.paused,
      playbackRate: finiteNonNegative(audio.playbackRate),
      positionMs: finiteNonNegative(audio.currentTime * 1_000),
      volume: audio.volume * PLAYBACK_VOLUME_MAX,
    }),
    pause: () => audio.pause(),
    play: () => audio.play(),
    seek: (positionMs) => {
      audio.currentTime = finiteNonNegative(positionMs) / 1_000;
    },
    setVolume: (volume) => {
      audio.volume = Math.max(0, Math.min(PLAYBACK_VOLUME_MAX, volume)) / PLAYBACK_VOLUME_MAX;
    },
    subscribe: (listener) => {
      const subscriptions = MEDIA_EVENT_MAP.map(([domEvent, authorityEvent]) => {
        const handleEvent = () => {
          if (!acceptEvent || acceptEvent(authorityEvent)) listener(authorityEvent);
        };
        audio.addEventListener(domEvent, handleEvent);
        return [domEvent, handleEvent] as const;
      });

      return () => {
        for (const [domEvent, handleEvent] of subscriptions) {
          audio.removeEventListener(domEvent, handleEvent);
        }
      };
    },
  };
}

/**
 * Adapts the main Renderer audio element to PlaybackAuthority without importing
 * Zustand or DOM globals into the Authority module.
 *
 * Integration requirements:
 * - `sessionKey` must change for every media load, including same-track replay.
 * - `initialState.volume` uses Scopify's shared 0..100 percentage scale.
 * - source URL loading and resume-checkpoint selection remain caller-owned;
 *   pass the selected resume position so it is published as an explicit
 *   discontinuity instead of allowing a legacy seek path to bypass Authority.
 * - command callbacks can call the existing player store until queue/like
 *   ownership is migrated; the adapter always invokes their latest version.
 * - once `onEnded`/`onError` callbacks are supplied here, remove equivalent
 *   JSX media handlers so queue advance and failure recovery do not run twice.
 * - legacy play/pause and volume effects may drive the element during rollout,
 *   but every seek/currentTime write must be routed through Authority.
 */
export function usePlaybackAuthority<TLyrics = unknown>({
  acceptMediaEvent,
  audioRef,
  callbacks,
  clock = browserClock,
  externalSessionControl = false,
  healthAnchorIntervalMs,
  identityFactory,
  initialState,
  resumePositionMs,
  scheduler = browserScheduler,
  sessionKey,
  sessionReason,
  transport,
}: UsePlaybackAuthorityOptions<TLyrics>): PlaybackAuthority<TLyrics> | null {
  const authorityRef = useRef<PlaybackAuthority<TLyrics> | null>(null);
  const activeSessionKeyRef = useRef(sessionKey);
  const sessionKeyRef = useRef(sessionKey);
  sessionKeyRef.current = sessionKey;
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const acceptMediaEventRef = useRef(acceptMediaEvent);
  acceptMediaEventRef.current = acceptMediaEvent;
  const initialStateRef = useRef(initialState);
  initialStateRef.current = initialState;
  const resumePositionRef = useRef(resumePositionMs);
  resumePositionRef.current = resumePositionMs;
  const sessionReasonRef = useRef(sessionReason);
  sessionReasonRef.current = sessionReason;
  const [authoritySnapshot, setAuthoritySnapshot] = useState<PlaybackAuthority<TLyrics> | null>(
    null,
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const callbackAdapter: PlaybackAuthorityCallbacks = {
      get ensureSource() {
        return callbacksRef.current?.ensureSource;
      },
      get next() {
        return callbacksRef.current?.next;
      },
      get onEnded() {
        return callbacksRef.current?.onEnded;
      },
      get onError() {
        return callbacksRef.current?.onError;
      },
      get onPhaseChange() {
        return callbacksRef.current?.onPhaseChange;
      },
      get onVolumeChange() {
        return callbacksRef.current?.onVolumeChange;
      },
      get previous() {
        return callbacksRef.current?.previous;
      },
      get toggleLike() {
        return callbacksRef.current?.toggleLike;
      },
    };
    const authority = new PlaybackAuthority<TLyrics>({
      callbacks: callbackAdapter,
      clock,
      healthAnchorIntervalMs,
      identityFactory,
      media: createHtmlAudioPlaybackMediaPort(
        audio,
        (event) => acceptMediaEventRef.current?.(event) ?? true,
      ),
      publish: transport.publish,
      scheduler,
    });
    const disconnectAuthority = transport.connectAuthority({
      dispatch: (command) => authority.dispatch(command),
      requestBootstrap: () => authority.publishBootstrap(),
    });

    activeSessionKeyRef.current = sessionKeyRef.current;
    authorityRef.current = authority;
    try {
      authority.start(initialStateRef.current);
      if (resumePositionRef.current !== undefined) {
        authority.discontinueTimeline(
          sessionReasonRef.current ?? "resume",
          resumePositionRef.current,
        );
      }
      setAuthoritySnapshot(authority);
    } catch (error) {
      authorityRef.current = null;
      disconnectAuthority();
      authority.stop();
      throw error;
    }

    return () => {
      authorityRef.current = null;
      disconnectAuthority();
      authority.stop();
      setAuthoritySnapshot((current) => (current === authority ? null : current));
    };
  }, [audioRef, clock, healthAnchorIntervalMs, identityFactory, scheduler, transport]);

  useEffect(() => {
    const authority = authorityRef.current;
    if (!authority) return;

    if (externalSessionControl) {
      // The hidden Playback Host applies complete sessions explicitly. Do not
      // let its local Zustand mirror create a competing Authority session.
      authority.updateState({ volume: initialState.volume });
      return;
    }

    if (activeSessionKeyRef.current !== sessionKey) {
      activeSessionKeyRef.current = sessionKey;
      authority.beginSession(initialState, {
        positionMs: resumePositionMs ?? 0,
        reason: sessionReason ?? "track-change",
      });
      return;
    }

    authority.updateState({
      canControl: initialState.canControl,
      liked: initialState.liked,
      lyrics: initialState.lyrics,
      lyricsVersion: initialState.lyricsVersion,
      track: initialState.track,
      volume: initialState.volume,
    });
  }, [externalSessionControl, initialState, resumePositionMs, sessionKey, sessionReason]);

  return authoritySnapshot;
}
