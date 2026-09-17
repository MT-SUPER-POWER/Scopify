"use client";

import { useEffect, useState } from "react";
import { SUBTITLE_PREVIEW_SCENES } from "@/constants/subtitle-preview";
import { subtitlePlaybackPosition } from "@/lib/settings/subtitlePlayback";
import type { LyricsPreviewSettings } from "@/types/appearance";
import type { SubtitlePlayback, SubtitlePreviewScene } from "@/types/subtitle-preview";

export function useSubtitlePreview(
  settings: LyricsPreviewSettings,
  updateSettings: (patch: Partial<LyricsPreviewSettings>) => void,
) {
  const [payload, setPayload] = useState(SUBTITLE_PREVIEW_SCENES.chinese);
  const activeScene =
    (Object.keys(SUBTITLE_PREVIEW_SCENES) as SubtitlePreviewScene[]).find((scene) => {
      const candidate = SUBTITLE_PREVIEW_SCENES[scene];
      return (
        candidate.source === payload.source &&
        candidate.target === payload.target &&
        candidate.isChinese === payload.isChinese &&
        settings.showTranslation === (scene === "bilingual" || scene === "chinese") &&
        (scene !== "chinese" || settings.autoCollapseChinese)
      );
    }) ?? null;
  const duration = settings.fillEnabled
    ? settings.fillDuration
    : settings.entrance === "typewriter"
      ? Math.max(1, Array.from(payload.source).length) * settings.characterInterval
      : settings.animationDuration;
  const [replayId, setReplayId] = useState(0);
  const [visible, setVisible] = useState(true);
  const [loop, setLoop] = useState(true);
  const [playback, setPlayback] = useState<SubtitlePlayback>({ position: 0, startedAt: null });
  useEffect(() => {
    setPlayback({ position: 0, startedAt: performance.now() });
  }, [duration]);
  const replay = () => {
    setVisible(true);
    setReplayId((id) => id + 1);
    setPlayback({ position: 0, startedAt: performance.now() });
  };
  const togglePlayback = () =>
    setPlayback((current) => {
      const position = subtitlePlaybackPosition(current, duration, loop, performance.now());
      return current.startedAt === null || (!loop && position >= duration)
        ? {
            position: position >= duration ? 0 : position,
            startedAt: performance.now(),
          }
        : { position, startedAt: null };
    });
  const seek = (progress: number) =>
    setPlayback({ position: (progress * duration) / 100, startedAt: null });
  const selectScene = (scene: keyof typeof SUBTITLE_PREVIEW_SCENES) => {
    setPayload(SUBTITLE_PREVIEW_SCENES[scene]);
    updateSettings({
      showTranslation: scene === "bilingual" || scene === "chinese",
      ...(scene === "chinese" ? { autoCollapseChinese: true } : {}),
    });
    replay();
  };
  return {
    activeScene,
    duration,
    selectScene,
    payload,
    setPayload,
    replayId,
    replay,
    visible,
    setVisible,
    loop,
    setLoop,
    playback,
    togglePlayback,
    seek,
  };
}
