"use client";

import { useEffect, useState } from "react";

import type { LyricAudioBands } from "@/types/lyrics";

const EMPTY_AUDIO_BANDS: LyricAudioBands = {
  bass: 0,
  lowMid: 0,
  mid: 0,
  power: 0,
  spectrum: [],
  treble: 0,
  vocal: 0,
};

export function useLyricAudioBands(): LyricAudioBands {
  const [audioBands, setAudioBands] = useState<LyricAudioBands>(EMPTY_AUDIO_BANDS);

  useEffect(() => {
    const onAudioBands = (event: Event) => {
      const nextBands = (event as CustomEvent<unknown>).detail;
      if (!nextBands || typeof nextBands !== "object") return;
      setAudioBands(nextBands as LyricAudioBands);
    };
    window.addEventListener("player-audio-bands", onAudioBands);
    return () => window.removeEventListener("player-audio-bands", onAudioBands);
  }, []);

  return audioBands;
}
