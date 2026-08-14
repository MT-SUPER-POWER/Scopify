"use client";

import { useRef } from "react";

import { useAudioVisualizer } from "@/hooks/player/useAudioVisualizer";
import { usePlaybackMediaEvents } from "@/hooks/player/usePlaybackMediaEvents";
import { usePlaybackMediaSource } from "@/hooks/player/usePlaybackMediaSource";
import type { PlaybackMediaRuntimeProviderProps } from "@/types/playbackMedia";

import { PlaybackAuthorityProvider } from "./PlaybackAuthorityProvider";

/**
 * The only component allowed to create a media element, Web Audio graph and
 * Authority in the main renderer.
 */
export function PlaybackMediaRuntimeProvider({ children }: PlaybackMediaRuntimeProviderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const source = usePlaybackMediaSource(audioRef);
  const eventHandlers = usePlaybackMediaEvents(source);
  useAudioVisualizer(audioRef);

  return (
    <PlaybackAuthorityProvider
      audioRef={audioRef}
      isMediaSourceLoadingRef={source.isMediaSourceLoadingRef}
      mediaSourceLoadRevisionRef={source.mediaSourceLoadRevisionRef}
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
