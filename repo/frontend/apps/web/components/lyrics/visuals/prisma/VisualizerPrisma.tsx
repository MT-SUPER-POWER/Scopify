"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useVisualizerSongCommit } from "@/hooks/lyrics/useVisualizerSongCommit";
import { PrismaRuntime } from "@/lib/lyrics/prisma/runtime";
import { DEFAULT_PRISMA_TUNING, type PrismaTuning } from "@/types/lyrics/prisma/model";
import type { VisualizerSharedProps } from "../../folia/src/components/visualizer/definition";
import { useVisualizerRuntime } from "../../folia/src/components/visualizer/runtime";
import { useFirstFrameDrawn } from "../../folia/src/components/visualizer/styleTransition/firstFrame";
import { resolveSubtitleFontSizes } from "../../folia/src/components/visualizer/subtitleFontSizes";
import VisualizerShell from "../../folia/src/components/visualizer/VisualizerShell";
import VisualizerSubtitleOverlay from "../../folia/src/components/visualizer/VisualizerSubtitleOverlay";
import type { Line } from "../../folia/src/types";
import { resolveThemeFontStack, resolveThemeFontWeight } from "../../folia/src/utils/fontStacks";
import { getLineRenderEndTime } from "../../folia/src/utils/lyrics/renderHints";

// components/lyrics/prisma/VisualizerPrisma.tsx
// 聚散's React shell: the shared background and subtitles, and a runtime built once. Song, tuning, theme and
// pause are pushed into it; time stays out of React state. Without WebGL2 it shows the current line as text.

const EMPTY_LINES: Line[] = [];

type Props = VisualizerSharedProps & { prismaTuning?: PrismaTuning };

const VisualizerPrisma: React.FC<Props> = (props) => {
  const {
    currentTime,
    currentLineIndex,
    lines,
    theme,
    audioPower,
    audioBands,
    showText = true,
    lyricsFontScale = 1,
    staticMode = false,
    paused = false,
    seed = "prisma",
    songTitle,
    hideTranslationSubtitle = false,
    isPlayerChromeHidden = false,
    showSubtitleTranslation,
    subtitleContentMode,
    subtitleTheme,
    subtitleFontScale,
    subtitleOverlayOpacity,
    subtitleOverlayBackground,
    prismaTuning = DEFAULT_PRISMA_TUNING,
  } = props;
  const { t } = useTranslation();
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<PrismaRuntime | null>(null);
  const [failed, setFailed] = useState(false);
  // Bumped when a lost WebGL context returns, which rebuilds the runtime.
  const [generation, setGeneration] = useState(0);
  const firstFrameDrawn = useFirstFrameDrawn();

  const committed = useVisualizerSongCommit({ seed, lines, currentTime, readyGraceMs: 3000 });
  const committedLines = committed.isInstrumental ? EMPTY_LINES : committed.lines;
  const song = useMemo(
    () => ({ lines: committedLines, seed: committed.seed ?? "prisma", title: songTitle }),
    [committedLines, committed.seed, songTitle],
  );

  const latest = useRef({
    theme,
    tuning: prismaTuning,
    song,
    lyricsFontScale,
    showText,
    paused,
    staticMode,
    firstFrameDrawn,
  });
  latest.current = {
    theme,
    tuning: prismaTuning,
    song,
    lyricsFontScale,
    showText,
    paused,
    staticMode,
    firstFrameDrawn,
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let runtime: PrismaRuntime;
    try {
      const current = latest.current;
      runtime = new PrismaRuntime(
        {
          host,
          currentTime,
          audioPower,
          audioBands,
          onFirstFrame: () => latest.current.firstFrameDrawn(),
          onFailed: () => {
            setFailed(true);
            latest.current.firstFrameDrawn();
          },
          onRestored: () => setGeneration((value) => value + 1),
        },
        current.theme,
        current.tuning,
      );
      runtime.setFontScale(current.lyricsFontScale);
      runtime.setShowText(current.showText);
      runtime.setPlayback(current.paused, current.staticMode);
      runtime.setSong(current.song);
    } catch (error) {
      console.warn("[Prisma] runtime failed to start", error);
      setFailed(true);
      latest.current.firstFrameDrawn();
      return undefined;
    }
    runtimeRef.current = runtime;
    setFailed(false);
    return () => {
      runtimeRef.current = null;
      runtime.destroy();
    };
  }, [audioBands, audioPower, currentTime, generation]);

  useEffect(() => {
    runtimeRef.current?.setSong(song);
  }, [song]);
  useEffect(() => {
    runtimeRef.current?.setTuning(prismaTuning);
  }, [prismaTuning]);
  useEffect(() => {
    runtimeRef.current?.setTheme(theme);
  }, [theme]);
  useEffect(() => {
    runtimeRef.current?.setFontScale(lyricsFontScale);
  }, [lyricsFontScale]);
  useEffect(() => {
    runtimeRef.current?.setShowText(showText);
  }, [showText]);
  useEffect(() => {
    runtimeRef.current?.setPlayback(paused, staticMode);
  }, [paused, staticMode]);
  // The loop stops while paused, so a seek has to ask for its frame.
  useEffect(
    () =>
      currentTime.on("change", () => {
        if (paused) runtimeRef.current?.requestFrame();
      }),
    [currentTime, paused],
  );

  const { activeLine, recentCompletedLine, nextLines } = useVisualizerRuntime({
    currentTime,
    currentLineIndex,
    lines,
    getLineEndTime: getLineRenderEndTime,
  });
  const subtitleFontSizes = resolveSubtitleFontSizes(lyricsFontScale);

  return (
    <VisualizerShell
      theme={theme}
      audioPower={audioPower}
      audioBands={audioBands}
      sharedProps={props}
    >
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />
        {failed && (
          <div
            className="absolute inset-0 flex items-center justify-center px-10 text-center"
            style={{
              color: theme.primaryColor,
              fontFamily: resolveThemeFontStack(theme),
              fontWeight: resolveThemeFontWeight(theme, 600),
              fontSize: `clamp(2rem, ${5.4 * lyricsFontScale}vw, 5.6rem)`,
            }}
          >
            {showText && !committed.isInstrumental
              ? activeLine?.fullText || t("folia.ui.waitingForMusic")
              : null}
          </div>
        )}
      </div>
      <VisualizerSubtitleOverlay
        showText={showText}
        activeLine={activeLine}
        recentCompletedLine={recentCompletedLine}
        nextLines={nextLines}
        theme={theme}
        subtitleTheme={subtitleTheme}
        translationFontSize={subtitleFontSizes.translationFontSize}
        upcomingFontSize={subtitleFontSizes.upcomingFontSize}
        subtitleFontScale={subtitleFontScale}
        subtitleOverlayOpacity={subtitleOverlayOpacity}
        subtitleOverlayBackground={subtitleOverlayBackground}
        isPlayerChromeHidden={isPlayerChromeHidden}
        hideTranslationSubtitle={hideTranslationSubtitle}
        showSubtitleTranslation={showSubtitleTranslation}
        subtitleContentMode={subtitleContentMode}
      />
    </VisualizerShell>
  );
};

export default VisualizerPrisma;
