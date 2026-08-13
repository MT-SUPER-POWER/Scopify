"use client";

import { useCallback, useMemo, useRef } from "react";

import { isExternalPlaybackSourceCurrent } from "@/lib/player/externalPlaybackSource";
import { waitForPlaybackSource } from "@/lib/player/playbackSource";
import { useAudioVisualizer } from "@/hooks/player/useAudioVisualizer";
import { usePlaybackMediaEvents } from "@/hooks/player/usePlaybackMediaEvents";
import { usePlaybackMediaSource } from "@/hooks/player/usePlaybackMediaSource";
import { usePlayerStore } from "@/store/module/player";
import type { PlaybackMediaRuntimeProviderProps } from "@/types/playbackHost";

import { PlaybackAuthorityProvider } from "./PlaybackAuthorityProvider";

/**
 * The only component allowed to create a media element, Web Audio graph and
 * Authority in a renderer. Dashboard Browser mode and the hidden Host reuse it.
 */
export function PlaybackMediaRuntimeProvider({
  authorityConnectionId,
  children,
  externalSessionControl,
  onAuthorityConnected,
}: PlaybackMediaRuntimeProviderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const source = usePlaybackMediaSource(audioRef, externalSessionControl);
  const eventHandlers = usePlaybackMediaEvents(source, externalSessionControl);
  useAudioVisualizer(audioRef);
  const ensureExternalMediaSource = useCallback(async () => {
    const audio = audioRef.current;
    const player = usePlayerStore.getState();
    const sourceUrl = player.currentSongUrl;
    if (!audio || !sourceUrl) return false;

    const identity = {
      loadRevision: player.playbackLoadRevision,
      sourceUrl,
    };
    return waitForPlaybackSource(audio, sourceUrl, () =>
      isExternalPlaybackSourceCurrent(usePlayerStore.getState(), identity),
    );
  }, [audioRef]);
  const resolvedExternalSessionControl = useMemo(
    () =>
      externalSessionControl
        ? {
            ...externalSessionControl,
            ensureSource: externalSessionControl.ensureSource ?? ensureExternalMediaSource,
          }
        : undefined,
    [ensureExternalMediaSource, externalSessionControl],
  );

  return (
    <PlaybackAuthorityProvider
      audioRef={audioRef}
      electronConnectionId={authorityConnectionId}
      externalSessionControl={resolvedExternalSessionControl}
      isMediaSourceLoadingRef={source.isMediaSourceLoadingRef}
      mediaSourceLoadRevisionRef={source.mediaSourceLoadRevisionRef}
      onAuthorityConnected={onAuthorityConnected}
    >
      <audio
        {...eventHandlers}
        className="hidden"
        crossOrigin="anonymous"
        preload="auto"
        ref={audioRef}
      />
      {children}
    </PlaybackAuthorityProvider>
  );
}
