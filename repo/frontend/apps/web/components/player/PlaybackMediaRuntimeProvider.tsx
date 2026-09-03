"use client";

import { useEffect, useRef } from "react";

import { useAudioVisualizer } from "@/hooks/player/useAudioVisualizer";
import { useHtmlAudioEngineAdapter } from "@/hooks/player/useHtmlAudioEngineAdapter";
import { usePlaybackMediaEvents } from "@/hooks/player/usePlaybackMediaEvents";
import { usePlaybackMediaSource } from "@/hooks/player/usePlaybackMediaSource";
import type { PlaybackMediaRuntimeProviderProps } from "@/types/playbackMedia";
import { setAudioElementOutputDevice } from "@/lib/player/audioOutput";
import { useAudioOutputStore } from "@/store/module/audioOutput";

import { PlaybackAuthorityProvider } from "./PlaybackAuthorityProvider";

/**
 * The only component allowed to create a media element, Web Audio graph and
 * Authority in the main renderer.
 */
export function PlaybackMediaRuntimeProvider({ children }: PlaybackMediaRuntimeProviderProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const selectedOutputDeviceId = useAudioOutputStore((state) => state.selectedDeviceId);
  const audioEngine = useHtmlAudioEngineAdapter(audioRef);
  const source = usePlaybackMediaSource(audioEngine);
  const eventHandlers = usePlaybackMediaEvents(source, audioEngine);
  useAudioVisualizer(audioRef);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedOutputDeviceId) return;
    void setAudioElementOutputDevice(audio, selectedOutputDeviceId).catch(() => {
      // A stored device can disappear between sessions. The browser keeps using its default output.
    });
  }, [selectedOutputDeviceId]);

  return (
    <PlaybackAuthorityProvider
      audioRef={audioRef}
      audioEngine={audioEngine}
      isMediaSourceLoadingRef={source.isMediaSourceLoadingRef}
      mediaSourceLoadRevisionRef={source.mediaSourceLoadRevisionRef}
    >
      <audio
        {...eventHandlers}
        className="hidden"
        crossOrigin="anonymous"
        data-playback-authority
        preload="auto"
        ref={audioRef}
      />
      {children}
    </PlaybackAuthorityProvider>
  );
}
