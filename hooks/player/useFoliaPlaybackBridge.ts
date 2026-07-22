"use client";

import { useMotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AudioBands } from "@/components/lyrics/folia/src/types";
import type { LyricAudioBands } from "@/types/lyrics";
import type { FoliaPlaybackBridge } from "@/types/foliaStage";

import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { findLatestActiveFoliaLineIndex } from "@/lib/lyrics/timeline";
import { usePlayerStore } from "@/store/module/player";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useTimeStore } from "@/store/module/time";

export function useFoliaPlaybackBridge(): FoliaPlaybackBridge {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const rawLyric = usePlayerStore((state) => state.lyric);
  const storedTimeMs = useTimeStore((state) => state.currentTime);
  const durationMs = useTimeStore((state) => state.totalTime);
  const lyricOffsetMs = useLyricStageStore((state) => state.lyricOffsetMs);
  const currentTime = useMotionValue(storedTimeMs / 1_000);
  const lyricCurrentTime = useMotionValue(storedTimeMs / 1_000);
  const audioPower = useMotionValue(0);
  const bass = useMotionValue(0);
  const lowMid = useMotionValue(0);
  const mid = useMotionValue(0);
  const vocal = useMotionValue(0);
  const treble = useMotionValue(0);
  const spectrum = useMotionValue(new Uint8Array(new ArrayBuffer(0)));
  const sourceTimeSecondsRef = useRef(storedTimeMs / 1_000);
  const sourceTimestampRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const currentLineIndexRef = useRef(-1);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const lyrics = useMemo(
    () => (rawLyric ? adaptLyricDataToFolia(adaptNeteaseLyric(rawLyric)) : null),
    [rawLyric],
  );
  const audioBands = useMemo<AudioBands>(
    () => ({ bass, lowMid, mid, spectrum, treble, vocal }),
    [bass, lowMid, mid, spectrum, treble, vocal],
  );

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    sourceTimeSecondsRef.current = currentTime.get();
    sourceTimestampRef.current = performance.now();
  }, [currentTime, isPlaying]);

  useEffect(() => {
    const nextTimeSeconds = storedTimeMs / 1_000;
    sourceTimeSecondsRef.current = nextTimeSeconds;
    sourceTimestampRef.current = performance.now();
    currentTime.set(nextTimeSeconds);
    lyricCurrentTime.set(nextTimeSeconds - lyricOffsetMs / 1_000);
  }, [currentTime, lyricCurrentTime, lyricOffsetMs, storedTimeMs]);

  useEffect(() => {
    const onPlayerTime = (event: Event) => {
      const timeMs = (event as CustomEvent<unknown>).detail;
      if (typeof timeMs !== "number" || !Number.isFinite(timeMs)) return;
      const nextTimeSeconds = timeMs / 1_000;
      sourceTimeSecondsRef.current = nextTimeSeconds;
      sourceTimestampRef.current = performance.now();
      currentTime.set(nextTimeSeconds);
      lyricCurrentTime.set(nextTimeSeconds - lyricOffsetMs / 1_000);
    };
    const onAudioBands = (event: Event) => {
      const bands = (event as CustomEvent<LyricAudioBands>).detail;
      if (!bands) return;
      bass.set(bands.bass);
      lowMid.set(bands.lowMid);
      mid.set(bands.mid);
      vocal.set(bands.vocal);
      treble.set(bands.treble);
      audioPower.set(bands.power);
      spectrum.set(Uint8Array.from(bands.spectrum));
    };

    window.addEventListener("player-audio-bands", onAudioBands);
    window.addEventListener("player-time", onPlayerTime);
    return () => {
      window.removeEventListener("player-audio-bands", onAudioBands);
      window.removeEventListener("player-time", onPlayerTime);
    };
  }, [
    audioPower,
    bass,
    currentTime,
    lowMid,
    lyricCurrentTime,
    lyricOffsetMs,
    mid,
    spectrum,
    treble,
    vocal,
  ]);

  useEffect(() => {
    let animationFrame = 0;
    const tick = (now: number) => {
      const nextTime = isPlayingRef.current
        ? sourceTimeSecondsRef.current + Math.max(0, now - sourceTimestampRef.current) / 1_000
        : sourceTimeSecondsRef.current;
      currentTime.set(nextTime);
      const effectiveLyricTime = nextTime - lyricOffsetMs / 1_000;
      lyricCurrentTime.set(effectiveLyricTime);

      const nextLineIndex = lyrics
        ? findLatestActiveFoliaLineIndex(lyrics.lines, effectiveLyricTime)
        : -1;
      if (nextLineIndex !== currentLineIndexRef.current) {
        currentLineIndexRef.current = nextLineIndex;
        setCurrentLineIndex(nextLineIndex);
      }
      animationFrame = requestAnimationFrame(tick);
    };

    sourceTimestampRef.current = performance.now();
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [currentTime, lyricCurrentTime, lyricOffsetMs, lyrics]);

  return {
    audioBands,
    audioPower,
    currentLineIndex,
    currentTime,
    durationSeconds: durationMs / 1_000,
    isPlaying,
    lines: lyrics?.lines ?? [],
    lyricCurrentTime,
    lyrics,
  };
}
