"use client";

import { useEffect, useRef } from "react";

import type { HtmlAudioEngineAdapter, HtmlAudioMediaEvent } from "@/types/playback/adapters";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";
import type { PlaybackMediaEventHandlers, PlaybackMediaSourceState } from "@/types/playback/media";
import { playerTrackKey } from "@/lib/player/trackIdentity";

/**
 * Projects HtmlAudioEngineAdapter events into existing UI stores while the
 * Zustand player remains the playback-session authority. DOM events are no
 * longer bound in JSX, preventing a second source/error event path.
 */
export function usePlaybackMediaEvents(
  source: PlaybackMediaSourceState,
  audioEngine: HtmlAudioEngineAdapter | null,
): PlaybackMediaEventHandlers {
  const currentTrackKey = usePlayerStore((state) =>
    state.currentTrack ? playerTrackKey(state.currentTrack) : null,
  );
  const failedSourceRetrySessionKeyRef = useRef<string | null>(null);
  const lastStoreWriteRef = useRef(0);
  const refreshingFailedSourceSessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    failedSourceRetrySessionKeyRef.current = null;
  }, [currentTrackKey]);

  useEffect(() => {
    if (!audioEngine) return;

    const handleSourceError = (mediaEvent: HtmlAudioMediaEvent) => {
      const player = usePlayerStore.getState();
      const trackKey = player.currentTrack ? playerTrackKey(player.currentTrack) : null;
      const failureSessionKey =
        trackKey !== null ? `${player.playbackSessionRevision}:${trackKey}` : null;
      const sourceHost = audioEngine.getSourceHost();

      if (!source.isActiveMediaSource()) {
        console.warn("[player] Ignored an error from an obsolete media source", {
          trackKey,
          sourceHost,
        });
        return;
      }

      console.error("[player] Media playback failed", {
        errorCode: mediaEvent.errorCode,
        errorMessage: mediaEvent.errorMessage,
        networkState: mediaEvent.networkState,
        readyState: mediaEvent.readyState,
        trackKey,
        sourceHost,
      });

      if (trackKey === null) {
        source.isMediaSourceLoadingRef.current = false;
        return;
      }

      if (refreshingFailedSourceSessionKeyRef.current === failureSessionKey) return;
      if (failedSourceRetrySessionKeyRef.current === failureSessionKey) {
        const failureIdentity = { revision: player.playbackLoadRevision, trackKey };
        source.isMediaSourceLoadingRef.current = true;
        void player.handlePlaybackFailure("audio", failureIdentity).finally(() => {
          if (source.isPlaybackSessionCurrent(failureSessionKey)) {
            source.isMediaSourceLoadingRef.current = false;
          }
        });
        return;
      }

      failedSourceRetrySessionKeyRef.current = failureSessionKey;
      source.isMediaSourceLoadingRef.current = true;
      refreshingFailedSourceSessionKeyRef.current = failureSessionKey;
      void player
        .refreshCurrentTrackUrl()
        .then(async (result) => {
          if (result.status !== "failed") return;
          await usePlayerStore.getState().handlePlaybackFailure("audio", result.identity);
          if (source.isPlaybackSessionCurrent(failureSessionKey)) {
            source.isMediaSourceLoadingRef.current = false;
          }
        })
        .catch((error) => {
          console.error("[player] Failed to refresh the playback source", error);
          if (source.isPlaybackSessionCurrent(failureSessionKey)) {
            source.isMediaSourceLoadingRef.current = false;
          }
        })
        .finally(() => {
          if (refreshingFailedSourceSessionKeyRef.current === failureSessionKey) {
            refreshingFailedSourceSessionKeyRef.current = null;
          }
        });
    };

    return audioEngine.subscribeMedia((event) => {
      if (!source.isActiveMediaSource()) return;

      switch (event.type) {
        case "can-play":
          source.isMediaSourceLoadingRef.current = false;
          return;
        case "duration-change":
          if (event.sample.durationMs > 0) {
            useTimeStore.getState().setTotalTime(event.sample.durationMs);
          }
          return;
        case "error":
          handleSourceError(event);
          return;
        case "pause":
          if (!source.isMediaSourceLoadingRef.current) {
            useTimeStore.getState().setCurrentTime(event.sample.positionMs);
          }
          return;
        case "playing":
          source.isMediaSourceLoadingRef.current = false;
          failedSourceRetrySessionKeyRef.current = null;
          return;
        case "progress":
          useTimeStore.getState().setBufferedTime(event.bufferedPositionMs);
          return;
        case "time-update": {
          if (event.sample.paused) return;
          const now = Date.now();
          if (now - lastStoreWriteRef.current <= 3_000) return;
          useTimeStore.getState().setCurrentTime(event.sample.positionMs);
          lastStoreWriteRef.current = now;
          return;
        }
        case "ended":
        case "load-start":
        case "rate-change":
        case "waiting":
          return;
      }
    });
  }, [audioEngine, source]);

  // Media subscriptions are managed above; retain this return shape to keep
  // the rendered <audio> compatible while consumers migrate away from JSX.
  return {};
}
