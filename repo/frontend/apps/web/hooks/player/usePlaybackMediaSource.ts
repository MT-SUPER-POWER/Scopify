"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import type { HtmlAudioEngineAdapter } from "@/types/playback/adapters";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";
import type { PlaybackMediaSourceState } from "@/types/playback/media";
import { playerTrackKey } from "@/lib/player/trackIdentity";

export function shouldWarmPlaybackUrl(input: {
  hasSong: boolean;
  hasSourceUrl: boolean;
  hasWarmed: boolean;
}): boolean {
  return !input.hasWarmed && input.hasSong && !input.hasSourceUrl;
}

/** Owns source replacement and its revision guards for the sole in-page media element. */
export function usePlaybackMediaSource(
  audioEngine: HtmlAudioEngineAdapter | null,
): PlaybackMediaSourceState {
  const isMediaSourceLoadingRef = useRef(false);
  const mediaSourceLoadRevisionRef = useRef(-1);
  const hasWarmedPlaybackUrlRef = useRef(false);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const currentSongUrl = usePlayerStore((state) => state.currentSongUrl);
  const playbackLoadRevision = usePlayerStore((state) => state.playbackLoadRevision);
  const refreshCurrentTrackUrl = usePlayerStore((state) => state.refreshCurrentTrackUrl);
  const sourceChangeMode = usePlayerStore((state) => state.sourceChangeMode);

  useEffect(() => {
    if (!audioEngine) return;

    const capturePreservedPosition = () => {
      const sample = audioEngine.getMediaSample();
      if (
        sourceChangeMode === "preserve-position" &&
        audioEngine.hasSource() &&
        Number.isFinite(sample.positionMs)
      ) {
        useTimeStore.getState().setCurrentTime(Math.max(0, sample.positionMs));
      }
    };

    if (!currentSongUrl) {
      capturePreservedPosition();
      isMediaSourceLoadingRef.current = currentTrack !== null;
      mediaSourceLoadRevisionRef.current = -1;
      audioEngine.clearSource(playbackLoadRevision);
      useTimeStore.getState().setBufferedTime(0);
      if (!currentTrack) {
        useTimeStore.getState().setCurrentTime(0);
        useTimeStore.getState().setTotalTime(0);
      }
      return;
    }

    if (
      mediaSourceLoadRevisionRef.current !== playbackLoadRevision ||
      !audioEngine.isCurrentSource(currentSongUrl)
    ) {
      capturePreservedPosition();
      isMediaSourceLoadingRef.current = true;
      mediaSourceLoadRevisionRef.current = playbackLoadRevision;
      audioEngine.setRemoteSource(currentSongUrl, playbackLoadRevision);
    }
    void usePlayerStore.getState().fetchCurrentLyric();
  }, [audioEngine, currentTrack, currentSongUrl, playbackLoadRevision, sourceChangeMode]);

  // Restored songs deliberately do not persist expiring CDN URLs. Warm one
  // while paused so the next user gesture can invoke play() against a source.
  useEffect(() => {
    if (
      !shouldWarmPlaybackUrl({
        hasSong: currentTrack !== null,
        hasSourceUrl: Boolean(currentSongUrl),
        hasWarmed: hasWarmedPlaybackUrlRef.current,
      })
    ) {
      return;
    }
    hasWarmedPlaybackUrlRef.current = true;

    void refreshCurrentTrackUrl();
  }, [currentTrack, currentSongUrl, refreshCurrentTrackUrl]);

  const isActiveMediaSource = useCallback(() => {
    if (!audioEngine) return false;
    const player = usePlayerStore.getState();
    return Boolean(
      player.currentSongUrl &&
      mediaSourceLoadRevisionRef.current === player.playbackLoadRevision &&
      audioEngine.isCurrentSource(player.currentSongUrl),
    );
  }, [audioEngine]);

  const isPlaybackSessionCurrent = useCallback((sessionKey: string | null) => {
    if (!sessionKey) return false;
    const player = usePlayerStore.getState();
    if (!player.currentTrack) return false;
    return (
      `${player.playbackSessionRevision}:${playerTrackKey(player.currentTrack)}` === sessionKey
    );
  }, []);

  return useMemo(
    () => ({
      isActiveMediaSource,
      isMediaSourceLoadingRef,
      isPlaybackSessionCurrent,
      mediaSourceLoadRevisionRef,
    }),
    [isActiveMediaSource, isPlaybackSessionCurrent],
  );
}
