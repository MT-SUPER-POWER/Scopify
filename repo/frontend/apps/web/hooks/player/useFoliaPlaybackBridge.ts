"use client";

import { useMotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AudioBands } from "@/components/lyrics/folia/src/types";
import type { LyricAudioBands, LyricChorusRange, LyricData } from "@/types/lyrics";
import type { FoliaPlaybackBridge } from "@/types/foliaStage";

import { useSongChorus } from "@/hooks/lyrics/useSongChorus";
import {
  usePlaybackProjection,
  usePlaybackProjectionStore,
} from "@/hooks/player/usePlaybackProjection";
import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import { findLatestActiveFoliaLineIndex } from "@/lib/lyrics/timeline";
import { subscribeLocalAudioFeatures } from "@/lib/audioFeature/localBus";
import { useLyricStageStore } from "@/store/module/lyrics";

const EMPTY_CHORUS_RANGES: LyricChorusRange[] = [];

export function useFoliaPlaybackBridge(active = true): FoliaPlaybackBridge {
  const playbackStore = usePlaybackProjectionStore<LyricData>();
  const playback = usePlaybackProjection<LyricData>();
  const isPlaying = playback.isPlaying;
  const rawLyric = playback.lyrics;
  const currentSongId = playback.track?.id ?? null;
  const lyricOffsetMs = useLyricStageStore((state) => state.lyricOffsetMs);
  const initialPositionSeconds = playbackStore.samplePositionMs() / 1_000;
  const currentTime = useMotionValue(initialPositionSeconds);
  const lyricCurrentTime = useMotionValue(initialPositionSeconds);
  const audioPower = useMotionValue(0);
  const bass = useMotionValue(0);
  const lowMid = useMotionValue(0);
  const mid = useMotionValue(0);
  const vocal = useMotionValue(0);
  const treble = useMotionValue(0);
  const spectrum = useMotionValue(new Uint8Array(new ArrayBuffer(0)));
  const currentLineIndexRef = useRef(-1);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const chorusQuery = useSongChorus(currentSongId);
  const chorusRanges = chorusQuery.data ?? EMPTY_CHORUS_RANGES;
  const lyrics = useMemo(
    () => (rawLyric ? adaptLyricDataToFolia(rawLyric, chorusRanges) : null),
    [chorusRanges, rawLyric],
  );
  const audioBands = useMemo<AudioBands>(
    () => ({ bass, lowMid, mid, spectrum, treble, vocal }),
    [bass, lowMid, mid, spectrum, treble, vocal],
  );

  useEffect(() => {
    if (!active) return;

    return subscribeLocalAudioFeatures((bands: LyricAudioBands) => {
      bass.set(bands.bass);
      lowMid.set(bands.lowMid);
      mid.set(bands.mid);
      vocal.set(bands.vocal);
      treble.set(bands.treble);
      audioPower.set(bands.power);
      spectrum.set(Uint8Array.from(bands.spectrum));
    });
  }, [active, audioPower, bass, lowMid, mid, spectrum, treble, vocal]);

  useEffect(() => {
    let animationFrame = 0;
    const sample = () => {
      const nextTime = playbackStore.samplePositionMs() / 1_000;
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
    };
    const tick = () => {
      sample();
      animationFrame = requestAnimationFrame(tick);
    };

    sample();
    if (!active) return;
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [active, currentTime, lyricCurrentTime, lyricOffsetMs, lyrics, playbackStore]);

  return {
    audioBands,
    audioPower,
    currentLineIndex,
    currentTime,
    durationSeconds: playback.durationMs / 1_000,
    isPlaying,
    lines: lyrics?.lines ?? [],
    lyricCurrentTime,
    lyrics,
  };
}
