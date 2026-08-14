"use client";

import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

import { isPlaybackSourceCurrent } from "@/lib/player/playbackSource";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";
import type { PlaybackMediaSourceState } from "@/types/playbackMedia";

export function shouldWarmPlaybackUrl(input: {
  hasSong: boolean;
  hasSourceUrl: boolean;
  hasWarmed: boolean;
}): boolean {
  return !input.hasWarmed && input.hasSong && !input.hasSourceUrl;
}

/** Owns source replacement and its revision guards for the sole in-page media element. */
export function usePlaybackMediaSource(
  audioRef: MutableRefObject<HTMLAudioElement | null>,
): PlaybackMediaSourceState {
  const isMediaSourceLoadingRef = useRef(false);
  const mediaSourceLoadRevisionRef = useRef(-1);
  const hasWarmedPlaybackUrlRef = useRef(false);
  const currentSongDetail = usePlayerStore((state) => state.currentSongDetail);
  const currentSongUrl = usePlayerStore((state) => state.currentSongUrl);
  const playbackLoadRevision = usePlayerStore((state) => state.playbackLoadRevision);
  const refreshCurrentTrackUrl = usePlayerStore((state) => state.refreshCurrentTrackUrl);
  const sourceChangeMode = usePlayerStore((state) => state.sourceChangeMode);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const capturePreservedPosition = () => {
      const hasSource = Boolean(audio.currentSrc || audio.getAttribute("src"));
      if (
        sourceChangeMode === "preserve-position" &&
        hasSource &&
        Number.isFinite(audio.currentTime)
      ) {
        useTimeStore.getState().setCurrentTime(Math.max(0, audio.currentTime * 1_000));
      }
    };

    if (!currentSongUrl) {
      capturePreservedPosition();
      isMediaSourceLoadingRef.current = currentSongDetail !== null;
      mediaSourceLoadRevisionRef.current = -1;
      audio.removeAttribute("src");
      audio.load();
      useTimeStore.getState().setBufferedTime(0);
      if (!currentSongDetail) {
        useTimeStore.getState().setCurrentTime(0);
        useTimeStore.getState().setTotalTime(0);
      }
      return;
    }

    if (audio.src !== currentSongUrl) {
      capturePreservedPosition();
      isMediaSourceLoadingRef.current = true;
      mediaSourceLoadRevisionRef.current = playbackLoadRevision;
      audio.src = currentSongUrl;
      audio.load();
    }
    void usePlayerStore.getState().fetchCurrentLyric();
  }, [audioRef, currentSongDetail, currentSongUrl, playbackLoadRevision, sourceChangeMode]);

  // Restored songs deliberately do not persist expiring CDN URLs. Warm one
  // while paused so the next user gesture can invoke play() against a source.
  useEffect(() => {
    if (
      !shouldWarmPlaybackUrl({
        hasSong: currentSongDetail !== null,
        hasSourceUrl: Boolean(currentSongUrl),
        hasWarmed: hasWarmedPlaybackUrlRef.current,
      })
    ) {
      return;
    }
    hasWarmedPlaybackUrlRef.current = true;

    void refreshCurrentTrackUrl();
  }, [currentSongDetail, currentSongUrl, refreshCurrentTrackUrl]);

  const isActiveMediaSource = useCallback((audio: HTMLAudioElement) => {
    const player = usePlayerStore.getState();
    return Boolean(
      player.currentSongUrl &&
      mediaSourceLoadRevisionRef.current === player.playbackLoadRevision &&
      isPlaybackSourceCurrent(audio, player.currentSongUrl),
    );
  }, []);

  const isPlaybackSessionCurrent = useCallback((sessionKey: string | null) => {
    if (!sessionKey) return false;
    const player = usePlayerStore.getState();
    const songId = player.currentSongDetail?.id;
    return songId !== undefined && `${player.playbackSessionRevision}:${songId}` === sessionKey;
  }, []);

  return {
    isActiveMediaSource,
    isMediaSourceLoadingRef,
    isPlaybackSessionCurrent,
    mediaSourceLoadRevisionRef,
  };
}
