"use client";

import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

import { isPlaybackSourceCurrent } from "@/lib/player/playbackSource";
import { usePlayerStore } from "@/store/module/player";
import type { PlaybackAuthorityExternalSessionControl } from "@/types/playbackAuthority";
import { useTimeStore } from "@/store/module/time";
import type { PlaybackMediaSourceState } from "@/types/playbackHost";

/** The dedicated Host resolves both URLs and lyrics through its Runtime catalog. */
export function shouldUseLegacyPlaybackCatalog(
  externalSessionControl: PlaybackAuthorityExternalSessionControl | undefined,
): boolean {
  return !externalSessionControl;
}

export function shouldWarmLegacyPlaybackUrl(input: {
  externalSessionControl: PlaybackAuthorityExternalSessionControl | undefined;
  hasSong: boolean;
  hasSourceUrl: boolean;
  hasWarmed: boolean;
}): boolean {
  return (
    shouldUseLegacyPlaybackCatalog(input.externalSessionControl) &&
    !input.hasWarmed &&
    input.hasSong &&
    !input.hasSourceUrl
  );
}

/** Owns source replacement and its revision guards for the sole in-page media element. */
export function usePlaybackMediaSource(
  audioRef: MutableRefObject<HTMLAudioElement | null>,
  externalSessionControl?: PlaybackAuthorityExternalSessionControl,
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
    // Host catalog resolution delivers source and lyric data as one guarded
    // transaction. Do not start the legacy lyric fetch as a competing catalog.
    if (shouldUseLegacyPlaybackCatalog(externalSessionControl)) {
      void usePlayerStore.getState().fetchCurrentLyric();
    }
  }, [
    audioRef,
    currentSongDetail,
    currentSongUrl,
    externalSessionControl,
    playbackLoadRevision,
    sourceChangeMode,
  ]);

  // Restored songs deliberately do not persist expiring CDN URLs. Warm one
  // while paused so the next user gesture can invoke play() against a source.
  useEffect(() => {
    // The Host Runtime owns catalog resolution and recovery. Calling the
    // legacy Store here would create a second source/catalog owner.
    if (
      !shouldWarmLegacyPlaybackUrl({
        externalSessionControl,
        hasSong: currentSongDetail !== null,
        hasSourceUrl: Boolean(currentSongUrl),
        hasWarmed: hasWarmedPlaybackUrlRef.current,
      })
    ) {
      return;
    }
    hasWarmedPlaybackUrlRef.current = true;

    void refreshCurrentTrackUrl();
  }, [currentSongDetail, currentSongUrl, externalSessionControl, refreshCurrentTrackUrl]);

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
