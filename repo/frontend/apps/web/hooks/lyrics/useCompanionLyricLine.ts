"use client";

import { useEffect, useMemo } from "react";
import {
  usePlaybackPositionMs,
  usePlaybackProjection,
  usePlaybackProjectionStore,
} from "@/hooks/player/usePlaybackProjection";
import { useSongChorus } from "@/hooks/lyrics/useSongChorus";
import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import { applyLyricOffsetMs, findLatestActiveFoliaLineIndex } from "@/lib/lyrics/timeline";
import {
  buildLineGraphemeTimeline,
  type GraphemeTiming,
} from "@/components/lyrics/folia/src/utils/lyrics/graphemeTiming";
import { isChineseSubtitleText } from "@/lib/lyrics/subtitleLanguage";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { Line as FoliaLine } from "@/components/lyrics/folia/src/types";
import type { LyricChorusRange, LyricData } from "@/types/lyrics";

export const INTERLUDE_FULL_TEXT = "......";
const EMPTY_CHORUS_RANGES: LyricChorusRange[] = [];
const JAPANESE_CHAR_REGEX = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

// Lines are immutable per lyric payload; segmenting graphemes every frame is the costly part.
const graphemeTimelineCache = new WeakMap<FoliaLine, GraphemeTiming[]>();

function computeFoliaLineProgress(line: FoliaLine, timeSeconds: number): number[] {
  let timeline = graphemeTimelineCache.get(line);
  if (!timeline) {
    timeline = buildLineGraphemeTimeline(line);
    graphemeTimelineCache.set(line, timeline);
  }
  return timeline.map((timing) => {
    if (timeSeconds < timing.startTime) return 0;
    if (timeSeconds >= timing.endTime) return 1;
    const duration = timing.endTime - timing.startTime;
    return duration > 0 ? clamp((timeSeconds - timing.startTime) / duration) : 1;
  });
}

function buildInterludeLine(startTime: number, endTime: number): FoliaLine {
  const dotCount = 6;
  const duration = Math.max(0.1, endTime - startTime);
  const wordDuration = duration / dotCount;
  return {
    startTime,
    endTime,
    fullText: INTERLUDE_FULL_TEXT,
    words: Array.from({ length: dotCount }, (_, i) => ({
      text: ".",
      startTime: startTime + i * wordDuration,
      endTime: startTime + (i + 1) * wordDuration,
    })),
  };
}

function findInterludeBounds(lines: FoliaLine[], timeSeconds: number, durationMs: number) {
  if (lines.length === 0) return null;

  let prevEndTime = lines[0].startTime;
  let nextStartTime: number | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const cur = lines[i];
    if (cur.startTime <= timeSeconds) {
      prevEndTime = Math.max(prevEndTime, cur.endTime);
    } else {
      nextStartTime = cur.startTime;
      break;
    }
  }

  const endTime = nextStartTime ?? (durationMs ? durationMs / 1_000 : prevEndTime + 10);
  return { endTime: Math.max(prevEndTime + 0.1, endTime), startTime: prevEndTime };
}

/**
 * 伴随窗口（桌面歌词、灵动岛、任务栏歌词）共用的当前歌词行：
 * 按播放位置与全局偏移定位 Folia 行，间奏时补一条点点点，并给出逐字填充进度。
 */
export function useCompanionLyricLine() {
  const projection = usePlaybackProjection<LyricData>();
  const playbackStore = usePlaybackProjectionStore();
  const position = usePlaybackPositionMs();
  const offset = useLyricStageStore((state) => state.lyricOffsetMs);

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

  const isInterludeLine = line?.fullText === INTERLUDE_FULL_TEXT;
  const isBetweenLinesInterlude =
    lines.length > 0 && line === null && timeSeconds >= lines[0].startTime;
  const isInterlude = isInterludeLine || isBetweenLinesInterlude;

  const interludeBounds =
    !line && isBetweenLinesInterlude
      ? findInterludeBounds(lines, timeSeconds, projection.durationMs)
      : null;
  const interludeStartTime = interludeBounds?.startTime ?? null;
  const interludeEndTime = interludeBounds?.endTime ?? null;
  // Keyed on the bounds rather than the clock so the interlude line keeps its identity per frame.
  const interludeLine = useMemo(
    () =>
      interludeStartTime === null || interludeEndTime === null
        ? null
        : buildInterludeLine(interludeStartTime, interludeEndTime),
    [interludeEndTime, interludeStartTime],
  );
  const activeLine = line ?? interludeLine;

  const displaySource =
    activeLine?.fullText || (isInterlude ? INTERLUDE_FULL_TEXT : (projection.track?.title ?? ""));

  const japaneseLyrics = useMemo(
    () => lines.some((l) => JAPANESE_CHAR_REGEX.test(l.fullText)),
    [lines],
  );

  const playback = useMemo(
    () => ({
      position: activeLine
        ? Math.max(
            0,
            applyLyricOffsetMs(playbackStore.samplePositionMs(), offset) -
              activeLine.startTime * 1_000,
          )
        : 0,
      startedAt: projection.isPlaying ? performance.now() : null,
    }),
    [activeLine, projection.isPlaying, playbackStore, offset],
  );

  useEffect(() => {
    // 偏移在主窗口里调整，伴随窗口靠 storage 事件和聚焦时重新读取。
    const sync = () => {
      void useLyricStageStore.persist.rehydrate();
    };
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key === useLyricStageStore.persist.getOptions().name) sync();
    };
    sync();
    window.addEventListener("storage", storage);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return {
    projection,
    track: projection.track,
    line,
    activeLine,
    isInterlude,
    displaySource,
    isChinese: activeLine
      ? isChineseSubtitleText(activeLine.fullText, activeLine.translation, japaneseLyrics)
      : false,
    index,
    /** 下一句原文：任务栏双行模式在没有翻译时用它填副行。 */
    nextLine: index >= 0 ? (lines[index + 1] ?? null) : null,
    playback,
    lineDurationMs: activeLine
      ? Math.max(0, (activeLine.endTime - activeLine.startTime) * 1_000)
      : 0,
    fillProgress: activeLine ? computeFoliaLineProgress(activeLine, timeSeconds) : undefined,
  };
}
