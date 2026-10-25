"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  usePlaybackProjection,
  usePlaybackProjectionStore,
} from "@/hooks/player/usePlaybackProjection";
import { useSongChorus } from "@/hooks/lyrics/useSongChorus";
import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import { applyLyricOffsetMs } from "@/lib/lyrics/timeline";
import { createCompanionLyricClock } from "@/lib/lyrics/companionLyricClock";
import { isChineseSubtitleText } from "@/lib/lyrics/subtitleLanguage";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { Line as FoliaLine } from "@/components/lyrics/folia/src/types";
import type { LyricChorusRange, LyricData } from "@/types/lyrics";

export const INTERLUDE_FULL_TEXT = "......";
const EMPTY_CHORUS_RANGES: LyricChorusRange[] = [];
const JAPANESE_CHAR_REGEX = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;

/** 面板等静态列表中展示的歌词文本：间奏与空行显示为音符。 */
export function getLyricDisplayText(line: FoliaLine) {
  return !line.fullText || line.fullText === INTERLUDE_FULL_TEXT ? "♪" : line.fullText;
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
 * 仅在歌词行或间奏区间变化时更新；逐字进度由文本子组件独立订阅。
 */
export function useCompanionLyricLine() {
  const projection = usePlaybackProjection<LyricData>();
  const playbackStore = usePlaybackProjectionStore();
  const offset = useLyricStageStore((state) => state.lyricOffsetMs);

  const rawLyric = projection.lyrics;
  const currentSongId = projection.track?.id ?? null;
  const chorusQuery = useSongChorus(currentSongId);
  const chorusRanges = chorusQuery.data ?? EMPTY_CHORUS_RANGES;

  const foliaLyrics = useMemo(
    () => (rawLyric ? adaptLyricDataToFolia(rawLyric, chorusRanges) : null),
    [chorusRanges, rawLyric],
  );

  const lines = useMemo(() => foliaLyrics?.lines ?? [], [foliaLyrics]);
  const clock = useMemo(
    () => createCompanionLyricClock(playbackStore, lines, offset),
    [playbackStore, lines, offset],
  );
  const cursor = useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getSnapshot);
  const index = cursor >= 0 ? cursor : -1;
  const line = index >= 0 ? lines[index] : null;

  const isInterludeLine = line?.fullText === INTERLUDE_FULL_TEXT;
  const isBetweenLinesInterlude = cursor < -1;
  const isInterlude = isInterludeLine || isBetweenLinesInterlude;

  const interludeBounds =
    !line && isBetweenLinesInterlude
      ? findInterludeBounds(lines, lines[-cursor - 2].startTime, projection.durationMs)
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
            applyLyricOffsetMs(
              projection.connection === "connected"
                ? playbackStore.samplePositionMs()
                : projection.positionMs,
              offset,
            ) -
              activeLine.startTime * 1_000,
          )
        : 0,
      startedAt: projection.isPlaying ? performance.now() : null,
    }),
    [
      activeLine,
      projection.connection,
      projection.isPlaying,
      projection.positionMs,
      playbackStore,
      offset,
    ],
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
    /** 全部歌词行与最近一句已开始的行（间奏中仍指向上一句），供主窗口右侧面板滚动歌词使用。 */
    lines,
    lastStartedIndex: index >= 0 ? index : isBetweenLinesInterlude ? -cursor - 2 : -1,
    /** 下一句原文：任务栏双行模式在没有翻译时用它填副行。 */
    nextLine: index >= 0 ? (lines[index + 1] ?? null) : null,
    playback,
    lineDurationMs: activeLine
      ? Math.max(0, (activeLine.endTime - activeLine.startTime) * 1_000)
      : 0,
  };
}
