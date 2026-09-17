"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  usePlaybackPositionMs,
  usePlaybackProjection,
  usePlaybackProjectionStore,
} from "@/hooks/player/usePlaybackProjection";
import { applyLyricOffsetMs, findActiveLyricLineIndex } from "@/lib/lyrics/timeline";
import { subtitleLineProgress } from "@/lib/lyrics/subtitleProgress";
import { runtime } from "@/lib/runtime";
import { useAppearanceStore } from "@/store/module/appearance";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { LyricData } from "@/types/lyrics";

export function useDesktopSubtitle() {
  const projection = usePlaybackProjection<LyricData>();
  const playbackStore = usePlaybackProjectionStore();
  const position = usePlaybackPositionMs();
  const offset = useLyricStageStore((state) => state.lyricOffsetMs);
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  const contentRef = useRef<HTMLDivElement>(null);
  const time = applyLyricOffsetMs(position, offset);
  const lines = projection.lyrics?.lines ?? [];
  const index = findActiveLyricLineIndex(lines, time);
  const line = index >= 0 ? lines[index] : null;
  const playback = useMemo(
    () => ({
      position: line
        ? Math.max(
            0,
            applyLyricOffsetMs(playbackStore.samplePositionMs(), offset) - line.startTimeMs,
          )
        : 0,
      startedAt: projection.isPlaying ? performance.now() : null,
    }),
    [line, projection, playbackStore, offset],
  );
  useEffect(() => {
    document.documentElement.classList.add("desktop-lyrics-html");
    document.body.classList.add("desktop-lyrics-body");
    const sync = () => {
      void useAppearanceStore.persist.rehydrate();
      void useLyricStageStore.persist.rehydrate();
    };
    const storage = (event: StorageEvent) => {
      if (event.key === null) sync();
      else if (event.key === useAppearanceStore.persist.getOptions().name)
        void useAppearanceStore.persist.rehydrate();
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
    index,
    playback,
    fillProgress: line ? subtitleLineProgress(line, time) : undefined,
  };
}
