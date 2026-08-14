"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";
import type { PlaybackMediaEventHandlers, PlaybackMediaSourceState } from "@/types/playbackMedia";

/** Keeps media DOM events out of layout code while retaining source/revision rejection. */
export function usePlaybackMediaEvents(
  source: PlaybackMediaSourceState,
): PlaybackMediaEventHandlers {
  const currentSongId = usePlayerStore((state) => state.currentSongDetail?.id);
  const failedSourceRetrySessionKeyRef = useRef<string | null>(null);
  const lastStoreWriteRef = useRef(0);
  const refreshingFailedSourceSessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    failedSourceRetrySessionKeyRef.current = null;
  }, [currentSongId]);

  const onError = useCallback<NonNullable<PlaybackMediaEventHandlers["onError"]>>(
    (event) => {
      const audio = event.currentTarget;
      const player = usePlayerStore.getState();
      const songId = player.currentSongDetail?.id ?? null;
      const failureSessionKey =
        songId !== null ? `${player.playbackSessionRevision}:${songId}` : null;
      let sourceHost: string | null = null;
      try {
        sourceHost = new URL(audio.currentSrc || audio.src).host || null;
      } catch {
        // Keep expiring URLs and their query parameters out of logs.
      }

      if (!source.isActiveMediaSource(audio)) {
        console.warn("[player] Ignored an error from an obsolete media source", {
          songId,
          sourceHost,
        });
        return;
      }

      console.error("[player] Media playback failed", {
        errorCode: audio.error?.code ?? null,
        errorMessage: audio.error?.message ?? null,
        networkState: audio.networkState,
        readyState: audio.readyState,
        songId,
        sourceHost,
      });

      if (!songId) {
        source.isMediaSourceLoadingRef.current = false;
        return;
      }

      if (refreshingFailedSourceSessionKeyRef.current === failureSessionKey) return;
      if (failedSourceRetrySessionKeyRef.current === failureSessionKey) {
        const failureIdentity = { revision: player.playbackLoadRevision, trackId: songId };
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
    },
    [source],
  );

  return useMemo(
    () => ({
      onCanPlay: (event) => {
        if (!source.isActiveMediaSource(event.currentTarget)) return;
        source.isMediaSourceLoadingRef.current = false;
      },
      onDurationChange: (event) => {
        if (!source.isActiveMediaSource(event.currentTarget)) return;
        const duration = event.currentTarget.duration;
        if (Number.isFinite(duration) && duration > 0) {
          useTimeStore.getState().setTotalTime(duration * 1_000);
        }
      },
      onError,
      onPause: (event) => {
        if (!source.isActiveMediaSource(event.currentTarget)) return;
        if (source.isMediaSourceLoadingRef.current) return;
        const positionMs = event.currentTarget.currentTime * 1_000;
        if (Number.isFinite(positionMs))
          useTimeStore.getState().setCurrentTime(Math.max(0, positionMs));
      },
      onPlaying: (event) => {
        if (!source.isActiveMediaSource(event.currentTarget)) return;
        source.isMediaSourceLoadingRef.current = false;
        failedSourceRetrySessionKeyRef.current = null;
      },
      onProgress: (event) => {
        const audio = event.currentTarget;
        if (!source.isActiveMediaSource(audio) || audio.buffered.length === 0) return;
        useTimeStore
          .getState()
          .setBufferedTime(audio.buffered.end(audio.buffered.length - 1) * 1_000);
      },
      onTimeUpdate: (event) => {
        const audio = event.currentTarget;
        if (!source.isActiveMediaSource(audio) || audio.paused) return;
        const currentTimeMs = audio.currentTime * 1_000;
        const now = Date.now();
        if (now - lastStoreWriteRef.current <= 3_000) return;
        useTimeStore.getState().setCurrentTime(currentTimeMs);
        lastStoreWriteRef.current = now;
      },
    }),
    [onError, source],
  );
}
