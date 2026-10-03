"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  usePlaybackPositionMs,
  usePlaybackProjection,
  usePlaybackProjectionStore,
} from "@/hooks/player/usePlaybackProjection";
import { useSongChorus } from "@/hooks/lyrics/useSongChorus";
import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import { applyLyricOffsetMs, findLatestActiveFoliaLineIndex } from "@/lib/lyrics/timeline";
import { buildLineGraphemeTimeline } from "@/components/lyrics/folia/src/utils/lyrics/graphemeTiming";
import { isChineseSubtitleText } from "@/lib/lyrics/subtitleLanguage";
import { runtime } from "@/lib/runtime";
import { useAppearanceStore } from "@/store/module/appearance";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { Line as FoliaLine } from "@/components/lyrics/folia/src/types";
import type { LyricChorusRange, LyricData } from "@/types/lyrics";

const EMPTY_CHORUS_RANGES: LyricChorusRange[] = [];
const JAPANESE_CHAR_REGEX = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function computeFoliaLineProgress(line: FoliaLine, timeSeconds: number): number[] {
  const timeline = buildLineGraphemeTimeline(line);
  return timeline.map((timing) => {
    if (timeSeconds < timing.startTime) return 0;
    if (timeSeconds >= timing.endTime) return 1;
    const duration = timing.endTime - timing.startTime;
    return duration > 0 ? clamp((timeSeconds - timing.startTime) / duration) : 1;
  });
}

export function useDesktopSubtitle() {
  const projection = usePlaybackProjection<LyricData>();
  const playbackStore = usePlaybackProjectionStore();
  const position = usePlaybackPositionMs();
  const offset = useLyricStageStore((state) => state.lyricOffsetMs);
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  const contentRef = useRef<HTMLDivElement>(null);

  const rawLyric = projection.lyrics;
  const currentSongId = projection.track?.id ?? null;
  const chorusQuery = useSongChorus(currentSongId);
  const chorusRanges = chorusQuery.data ?? EMPTY_CHORUS_RANGES;

  const foliaLyrics = useMemo(
    () => (rawLyric ? adaptLyricDataToFolia(rawLyric, chorusRanges) : null),
    [chorusRanges, rawLyric],
  );

  const timeMs = applyLyricOffsetMs(position, offset);
  const timeSeconds = timeMs / 1_000;
  const lines = useMemo(() => foliaLyrics?.lines ?? [], [foliaLyrics]);
  const index = foliaLyrics ? findLatestActiveFoliaLineIndex(lines, timeSeconds) : -1;
  const line = index >= 0 ? lines[index] : null;

  const japaneseLyrics = useMemo(
    () => lines.some((l) => JAPANESE_CHAR_REGEX.test(l.fullText)),
    [lines],
  );

  const playback = useMemo(
    () => ({
      position: line
        ? Math.max(
            0,
            applyLyricOffsetMs(playbackStore.samplePositionMs(), offset) - line.startTime * 1_000,
          )
        : 0,
      startedAt: projection.isPlaying ? performance.now() : null,
    }),
    [line, projection.isPlaying, playbackStore, offset],
  );

  useEffect(() => {
    document.documentElement.classList.add("desktop-lyrics-html");
    document.body.classList.add("desktop-lyrics-body");
    const sync = () => {
      void useLyricStageStore.persist.rehydrate();
    };
    const storage = (event: StorageEvent) => {
      if (event.key === null) sync();
      else if (event.key === useLyricStageStore.persist.getOptions().name)
        void useLyricStageStore.persist.rehydrate();
    };
    sync();
    window.addEventListener("storage", storage);
    window.addEventListener("focus", sync);
    return () => {
      document.documentElement.classList.remove("desktop-lyrics-html");
      document.body.classList.remove("desktop-lyrics-body");
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", sync);
    };
  }, []);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        runtime.desktopLyrics.sendCommand({
          type: "resize-desktop-lyric-window",
          width: settings.maxWidth + 32,
          height: Math.ceil(node.getBoundingClientRect().height) + 16,
        }),
      );
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [settings.maxWidth]);

  return {
    projection,
    settings,
    contentRef,
    line,
    isChinese: line
      ? isChineseSubtitleText(line.fullText, line.translation, japaneseLyrics)
      : false,
    index,
    playback,
    fillProgress: line ? computeFoliaLineProgress(line, timeSeconds) : undefined,
  };
}
