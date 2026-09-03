"use client";

import { useEffect, useRef, useState } from "react";

import { createHtmlAudioPlaybackMediaPort } from "@/lib/player/adapters/htmlAudioEngineAdapter";
import { PlaybackAuthority } from "@/lib/playbackProjection/authority";
import type {
  PlaybackAuthorityCallbacks,
  PlaybackAuthorityScheduler,
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

export { createHtmlAudioPlaybackMediaPort } from "@/lib/player/adapters/htmlAudioEngineAdapter";

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
  audioEngine,
  audioRef,
  callbacks,
  clock = browserClock,
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
    if (!audioRef.current || !audioEngine) return;

    const callbackAdapter: PlaybackAuthorityCallbacks = {
      get ensureSource() {
        return callbacksRef.current?.ensureSource;
      },
      get moveQueueItem() {
        return callbacksRef.current?.moveQueueItem;
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
      get playQueueIndex() {
        return callbacksRef.current?.playQueueIndex;
      },
      get previous() {
        return callbacksRef.current?.previous;
      },
      get removeQueueItem() {
        return callbacksRef.current?.removeQueueItem;
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
        audioEngine,
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
  }, [audioEngine, audioRef, clock, healthAnchorIntervalMs, identityFactory, scheduler, transport]);

  useEffect(() => {
    const authority = authorityRef.current;
    if (!authority) return;

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
  }, [initialState, resumePositionMs, sessionKey, sessionReason]);

  return authoritySnapshot;
}
