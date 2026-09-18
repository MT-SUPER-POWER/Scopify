"use client";

import { useEffect, useState } from "react";
import { SUBTITLE_PREVIEW_SCENES } from "@/constants/subtitle-preview";
import { isChineseSubtitleText } from "@/lib/lyrics/subtitleLanguage";
import { subtitlePlaybackPosition } from "@/lib/settings/subtitlePlayback";
import type { LyricsPreviewSettings } from "@/types/appearance";
import type { SubtitlePlayback, SubtitlePreviewScene } from "@/types/subtitle-preview";

export function useSubtitlePreview(settings: LyricsPreviewSettings, palettePreview = false) {
  const [sceneLayout, setSceneLayout] = useState<Partial<LyricsPreviewSettings>>(
    palettePreview ? { showTranslation: true } : {},
  );
  useEffect(
    () => setSceneLayout(palettePreview ? { showTranslation: true } : {}),
    [settings.showTranslation, settings.autoCollapseChinese, palettePreview],
  );
  const previewSettings = {
    ...settings,
    ...sceneLayout,
    ...(palettePreview
      ? {
          fillEnabled: true,
          entrance: settings.entrance === "typewriter" ? ("fade" as const) : settings.entrance,
        }
      : {}),
  };
  const [content, setPayload] = useState(
    palettePreview ? SUBTITLE_PREVIEW_SCENES.bilingual : SUBTITLE_PREVIEW_SCENES.chinese,
  );
  const payload = {
    ...content,
    isChinese: isChineseSubtitleText(content.source, content.target),
  };
  const activeScene =
    (Object.keys(SUBTITLE_PREVIEW_SCENES) as SubtitlePreviewScene[]).find((scene) => {
      const candidate = SUBTITLE_PREVIEW_SCENES[scene];
      return (
        candidate.source === payload.source &&
        candidate.target === payload.target &&
        candidate.isChinese === payload.isChinese &&
        previewSettings.showTranslation === (scene === "bilingual" || scene === "chinese") &&
        (scene !== "chinese" || previewSettings.autoCollapseChinese)
      );
    }) ?? null;
  const duration = previewSettings.fillEnabled
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
  const selectScene = (scene: keyof typeof SUBTITLE_PREVIEW_SCENES) => {
    setPayload(SUBTITLE_PREVIEW_SCENES[scene]);
    setSceneLayout({
      showTranslation: scene === "bilingual" || scene === "chinese",
      ...(scene === "chinese" ? { autoCollapseChinese: true } : {}),
    });
    replay();
  };
  return {
    previewSettings,
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
  };
}
