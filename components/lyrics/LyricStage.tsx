"use client";

import { useEffect, useState } from "react";

import type { DesktopLyricCommand } from "@/types/desktopLyric";
import type { LyricVisualizerFrame } from "@/types/lyrics";

import { useLyricAudioBands } from "@/hooks/player/useLyricAudioBands";
import { useLyricStageData } from "@/hooks/player/useLyricStageData";
import { useLyricStageStore } from "@/store/module/lyrics";

import { LyricStageChrome } from "./LyricStageChrome";
import { LyricStageLyrics } from "./LyricStageLyrics";
import { lyricVisualizerRegistry } from "./visualizers/registry";

/** Folia-derived replacement for the retired AMLL lyric presentation runtime. */
export function LyricStage({ onClose }: { onClose: () => void }) {
  const [isBorderVisible, setIsBorderVisible] = useState(false);
  const [isChromeVisible, setIsChromeVisible] = useState(true);
  const [isTransparent, setIsTransparent] = useState(false);
  const audioBands = useLyricAudioBands();
  const { activeLineIndex, currentTimeMs, isPlaying, lyrics } = useLyricStageData();
  const { fontScale, mode, showRomanization, showTranslation } = useLyricStageStore();
  const Visualizer = lyricVisualizerRegistry[mode];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onDesktopCommand = (event: Event) => {
      const command = (event as CustomEvent<DesktopLyricCommand>).detail;
      if (!command) return;
      if (command.type === "set-stage-transparent") setIsTransparent(command.enabled);
      if (command.type === "set-stage-border-visible") setIsBorderVisible(command.visible);
      if (command.type === "set-stage-controls-visible") setIsChromeVisible(command.visible);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("desktop-lyric:stage-command", onDesktopCommand);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("desktop-lyric:stage-command", onDesktopCommand);
    };
  }, [onClose]);

  const frame: LyricVisualizerFrame = {
    activeLineIndex,
    audioBands,
    currentTimeMs,
    isPlaying,
    lyrics,
  };

  return (
    <section
      className={
        isBorderVisible
          ? "fixed inset-0 z-100 overflow-hidden border border-white/30 text-white"
          : "fixed inset-0 z-100 overflow-hidden text-white"
      }
      aria-label="Lyrics"
    >
      <div className={isTransparent ? "opacity-0" : undefined}>
        <Visualizer frame={frame} />
        <div className="pointer-events-none absolute inset-0 bg-black/35" />
      </div>
      {isChromeVisible ? <LyricStageChrome onClose={onClose} /> : null}
      <main className="relative z-10 mx-auto flex size-full max-w-5xl items-center px-6 py-20 sm:px-12">
        {lyrics?.isPureMusic ? (
          <p className="w-full text-center text-2xl font-semibold text-white/75">Pure music</p>
        ) : lyrics?.lines.length ? (
          <LyricStageLyrics
            activeLineIndex={activeLineIndex}
            currentTimeMs={currentTimeMs}
            fontScale={fontScale}
            lines={lyrics.lines}
            showRomanization={showRomanization}
            showTranslation={showTranslation}
          />
        ) : (
          <p className="w-full text-center text-2xl font-semibold text-white/65">
            No lyrics available
          </p>
        )}
      </main>
    </section>
  );
}
