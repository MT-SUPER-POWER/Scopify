"use client";

import { useEffect, useState } from "react";
import { useMotionValue } from "framer-motion";

import {
  FOLIA_SETTINGS_PREVIEW_CONTENT,
  FOLIA_SETTINGS_PREVIEW_DURATION_SECONDS,
  FOLIA_SETTINGS_PREVIEW_LINES,
} from "@/constants/lyricsPreview";

export function useFoliaSettingsPreview() {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const audioPower = useMotionValue(0.45);
  const bass = useMotionValue(0.36);
  const lowMid = useMotionValue(0.48);
  const mid = useMotionValue(0.55);
  const vocal = useMotionValue(0.62);
  const treble = useMotionValue(0.41);
  const currentTime = useMotionValue(0);
  const lyricCurrentTime = useMotionValue(0);

  useEffect(() => {
    const startedAt = performance.now();
    let animationFrame = 0;

    const update = (now: number) => {
      const time = ((now - startedAt) / 1_000) % FOLIA_SETTINGS_PREVIEW_DURATION_SECONDS;
      const pulse = (speed: number, offset: number) =>
        0.2 + (Math.sin(time * speed + offset) + 1) * 0.3;
      const lineIndex = FOLIA_SETTINGS_PREVIEW_LINES.findIndex(
        (line) => time >= line.startTime && time < line.endTime,
      );

      currentTime.set(time);
      lyricCurrentTime.set(time);
      audioPower.set(pulse(2.2, 0.3));
      bass.set(pulse(1.7, 0));
      lowMid.set(pulse(2.6, 0.8));
      mid.set(pulse(3.1, 1.4));
      vocal.set(pulse(2.3, 2.2));
      treble.set(pulse(3.7, 2.8));
      setCurrentLineIndex((current) => (current === lineIndex ? current : lineIndex));
      animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [audioPower, bass, currentTime, lowMid, lyricCurrentTime, mid, treble, vocal]);

  return {
    audioBands: { bass, lowMid, mid, treble, vocal },
    audioPower,
    currentLineIndex,
    currentTime,
    lines: FOLIA_SETTINGS_PREVIEW_LINES,
    lyricCurrentTime,
    ...FOLIA_SETTINGS_PREVIEW_CONTENT,
  };
}
