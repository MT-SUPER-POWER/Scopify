"use client";

import { useEffect } from "react";

import type { DesktopPlaybackWallpaperModel } from "@scopify/desktop-contract";

import { downsampleSpectrum } from "@/lib/desktopPlaybackWallpaper/playback";
import { runtime } from "@/lib/runtime";
import type { LyricAudioBands } from "@/types/lyrics";

const AUDIO_FRAME_INTERVAL_MS = 33;
const MAX_SPECTRUM_BINS = 256;

export function useDesktopPlaybackWallpaperAudioPublisher() {
  useEffect(() => {
    if (!runtime.isDesktop) return;

    let active = false;
    let lastPublishedAt = 0;
    const updateModel = (model: DesktopPlaybackWallpaperModel) => {
      active = model.status.state === "running" || model.status.state === "starting";
    };
    const onAudioBands = (event: Event) => {
      if (!active) return;
      const now = performance.now();
      if (now - lastPublishedAt < AUDIO_FRAME_INTERVAL_MS) return;
      lastPublishedAt = now;

      const bands = (event as CustomEvent<LyricAudioBands>).detail;
      if (!bands) return;
      runtime.desktopPlaybackWallpaper.publishAudioFrame({
        bass: bands.bass,
        lowMid: bands.lowMid,
        mid: bands.mid,
        power: bands.power,
        sampledAt: Date.now(),
        spectrum: downsampleSpectrum(bands.spectrum, MAX_SPECTRUM_BINS),
        treble: bands.treble,
        vocal: bands.vocal,
      });
    };

    void runtime.desktopPlaybackWallpaper.getModel().then(updateModel);
    const unsubscribe = runtime.desktopPlaybackWallpaper.onModelChanged(updateModel);
    window.addEventListener("player-audio-bands", onAudioBands);
    return () => {
      unsubscribe();
      window.removeEventListener("player-audio-bands", onAudioBands);
    };
  }, []);
}
