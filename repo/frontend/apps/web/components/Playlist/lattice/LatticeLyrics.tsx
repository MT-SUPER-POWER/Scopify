"use client";

import { useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useFoliaPlaybackBridge } from "@/hooks/player/useFoliaPlaybackBridge";
import { useFoliaPresentationAppearance } from "@/hooks/player/useFoliaPresentationAppearance";
import { useFontsEpoch } from "@/components/lyrics/folia/src/hooks/useFontsEpoch";
import { useLatticeLyricCanvas } from "@/hooks/playlist/useLatticeLyricCanvas";
import type { LatticeLyricsProps } from "@/types/playlist/latticeComponents";
import type { LatticeLyricInput } from "@/types/playlist/latticeLyrics";
import { posterCopyClass, posterSubtitleClass, posterTitleClass } from "./latticePosterCopy";

export default function LatticeLyrics({ track }: LatticeLyricsProps) {
  const bridge = useFoliaPlaybackBridge();
  const { theme, subtitleTheme, settings } = useFoliaPresentationAppearance();
  // A photographic poster always needs light ink; preserve the chosen fonts and accents.
  const posterTheme = useMemo(() => ({ ...theme, primaryColor: "#ffffff" }), [theme]);
  const posterSubtitleTheme = useMemo(
    () => ({ ...subtitleTheme, primaryColor: "#ffffff" }),
    [subtitleTheme],
  );
  const reducedMotion = useReducedMotion();
  const fontsEpoch = useFontsEpoch();
  const host = useRef<HTMLDivElement>(null);
  const { showSubtitleTranslation, hideTranslationSubtitle, subtitleContentMode } = settings;
  const input = useMemo<LatticeLyricInput>(
    () => ({
      currentTime: bridge.lyricCurrentTime,
      currentLineIndex: bridge.currentLineIndex,
      lines: bridge.lines,
      paused: !bridge.isPlaying,
      theme: posterTheme,
      subtitleTheme: posterSubtitleTheme,
      showSubtitleTranslation,
      hideTranslationSubtitle,
      subtitleContentMode,
      songKey: String(track.id),
      keywordColoringEnabled: true,
      reducedMotion: Boolean(reducedMotion),
      fontsEpoch,
    }),
    [
      bridge.lyricCurrentTime,
      bridge.currentLineIndex,
      bridge.lines,
      bridge.isPlaying,
      posterTheme,
      posterSubtitleTheme,
      showSubtitleTranslation,
      hideTranslationSubtitle,
      subtitleContentMode,
      track.id,
      reducedMotion,
      fontsEpoch,
    ],
  );
  const ready = useLatticeLyricCanvas(host, input);
  const artist = track.ar.map((item) => item.name).join(" / ");
  return (
    <>
      <span
        className={
          ready ? "absolute top-18 right-18 left-10 flex flex-col gap-1.5" : posterCopyClass
        }
      >
        <strong
          className={ready ? "truncate text-[22px] leading-tight font-semibold" : posterTitleClass}
          title={track.name}
        >
          {track.name}
        </strong>
        <small
          className={
            ready ? "leading-1.35 truncate text-[14px] font-medium opacity-65" : posterSubtitleClass
          }
          title={artist}
        >
          {artist}
        </small>
      </span>
      <div
        className="pointer-events-none absolute inset-x-8 top-35 bottom-46 z-1 opacity-0 data-[ready=true]:opacity-100"
        data-ready={ready}
      >
        <div
          ref={host}
          className="absolute inset-0 overflow-hidden [&_canvas]:block [&_canvas]:size-full"
          aria-hidden="true"
        />
        {ready && <span className="sr-only">{input.lines[input.currentLineIndex]?.fullText}</span>}
      </div>
    </>
  );
}
