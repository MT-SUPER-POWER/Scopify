"use client";

import { Heart, MousePointer2, Pause, Pin, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { DesktopLyricPreferences } from "@/types/desktopLyric";
import type { LyricData, LyricDisplayLine } from "@/types/lyrics";

import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackPositionMs, usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import {
  applyLyricOffsetMs,
  findActiveLyricLineIndex,
  getWordProgress,
} from "@/lib/lyrics/timeline";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";

/** Electron-only transparent companion supplied by the shared desktop IPC contract. */
export function DesktopLyricView() {
  const { t } = useI18n();
  const [preferences, setPreferences] = useState<DesktopLyricPreferences | null>(null);
  const projection = usePlaybackProjection<LyricData>();
  const playbackTimeMs = usePlaybackPositionMs();
  const lyricOffsetMs = useLyricStageStore((state) => state.lyricOffsetMs);
  const currentLyricTimeMs = applyLyricOffsetMs(playbackTimeMs, lyricOffsetMs);
  const playbackCommands = usePlaybackCommands();
  const { activeLine, nextLine } = useMemo(() => {
    const lines = projection.lyrics?.lines ?? [];
    const activeIndex = findActiveLyricLineIndex(lines, currentLyricTimeMs);
    return {
      activeLine: activeIndex >= 0 ? lines[activeIndex] : null,
      nextLine: activeIndex >= 0 ? (lines[activeIndex + 1] ?? null) : (lines[0] ?? null),
    };
  }, [currentLyricTimeMs, projection.lyrics]);

  useEffect(() => {
    document.documentElement.classList.add("desktop-lyrics-html");
    document.body.classList.add("desktop-lyrics-body");
    void runtime.desktopLyrics.getPreferences().then(setPreferences);
    return () => {
      document.documentElement.classList.remove("desktop-lyrics-html");
      document.body.classList.remove("desktop-lyrics-body");
    };
  }, []);

  const updatePreferences = (update: Partial<DesktopLyricPreferences>) => {
    void runtime.desktopLyrics.updatePreferences(update).then(setPreferences);
  };
  const title = projection.track?.title ?? "";
  const artistNames = projection.track?.artistNames.join(", ") ?? "";

  return (
    <main
      data-desktop-lyrics-root
      className="h-screen w-screen overflow-hidden bg-transparent p-2 text-white"
    >
      <section className="h-full border border-white/20 bg-black/55 px-4 py-3 shadow-2xl backdrop-blur-xl">
        <header
          className="flex h-6 items-center justify-between text-[11px] text-white/55"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        >
          <span className="min-w-0 truncate">
            {title}
            {artistNames ? ` - ${artistNames}` : ""}
          </span>
          <div
            className="flex items-center"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <button
              type="button"
              title={t("desktopLyrics.keepOnTop")}
              aria-label={t("desktopLyrics.keepOnTop")}
              onClick={() => updatePreferences({ alwaysOnTop: !preferences?.alwaysOnTop })}
              className={cn("p-1.5", preferences?.alwaysOnTop ? "text-white" : "text-white/35")}
            >
              <Pin className="size-3.5" />
            </button>
            <button
              type="button"
              title={t("desktopLyrics.clickThrough")}
              aria-label={t("desktopLyrics.clickThrough")}
              onClick={() => updatePreferences({ clickThrough: !preferences?.clickThrough })}
              className={cn("p-1.5", preferences?.clickThrough ? "text-white" : "text-white/35")}
            >
              <MousePointer2 className="size-3.5" />
            </button>
            <button
              type="button"
              title={t("desktopLyrics.close")}
              aria-label={t("desktopLyrics.close")}
              onClick={() => void runtime.desktopLyrics.close()}
              className="p-1.5 text-white/55 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </header>

        <div className="flex h-34 flex-col justify-center px-4">
          <CompactLyricLine
            currentTimeMs={currentLyricTimeMs}
            line={activeLine}
            onSeek={(positionMs) => void playbackCommands.seek(positionMs)}
            showTranslation={preferences?.showSecondaryLyric ?? true}
          />
          {nextLine ? (
            <p className="mt-3 text-center text-sm text-white/45">{nextLine.text}</p>
          ) : null}
        </div>

        <footer
          className="flex items-center justify-center gap-3"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            type="button"
            title={t("desktopLyrics.previous")}
            aria-label={t("desktopLyrics.previous")}
            onClick={() => void playbackCommands.previous()}
            className="p-1.5 text-white/75 hover:text-white"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            type="button"
            title={t("desktopLyrics.playPause")}
            aria-label={t("desktopLyrics.playPause")}
            onClick={() => void playbackCommands.toggle()}
            className="p-1.5 text-white hover:text-cyan-100"
          >
            {projection.isPlaying ? (
              <Pause className="size-4 fill-current" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
          </button>
          <button
            type="button"
            title={t("desktopLyrics.next")}
            aria-label={t("desktopLyrics.next")}
            onClick={() => void playbackCommands.next()}
            className="p-1.5 text-white/75 hover:text-white"
          >
            <SkipForward className="size-4" />
          </button>
          <button
            type="button"
            title={t("desktopLyrics.like")}
            aria-label={t("desktopLyrics.like")}
            onClick={() => void playbackCommands.toggleLike()}
            className={cn(
              "p-1.5",
              projection.liked ? "text-rose-300" : "text-white/75 hover:text-white",
            )}
          >
            <Heart className={cn("size-4", projection.liked && "fill-current")} />
          </button>
        </footer>
      </section>
    </main>
  );
}

function CompactLyricLine({
  currentTimeMs,
  line,
  onSeek,
  showTranslation,
}: {
  currentTimeMs: number;
  line: LyricDisplayLine | null;
  onSeek(positionMs: number): void;
  showTranslation: boolean;
}) {
  const { t } = useI18n();
  if (!line)
    return (
      <span className="block text-center text-xl font-semibold text-white/60">
        {t("folia.ui.noLyricsAvailable")}
      </span>
    );
  return (
    <button
      type="button"
      onClick={() => onSeek(line.startTimeMs)}
      className="block w-full text-center text-xl leading-tight font-semibold"
    >
      {line.words.map((word, index) => (
        <DesktopWordText
          key={`${word.startTimeMs}-${index}`}
          currentTimeMs={currentTimeMs}
          word={word}
        />
      ))}
      {showTranslation && line.translation ? (
        <span className="mt-1 block text-sm font-medium text-white/60">{line.translation}</span>
      ) : null}
    </button>
  );
}

function DesktopWordText({
  currentTimeMs,
  word,
}: {
  currentTimeMs: number;
  word: LyricDisplayLine["words"][number];
}) {
  const characters = Array.from(word.text);
  const completedCharacters = Math.round(characters.length * getWordProgress(word, currentTimeMs));
  return (
    <span className="whitespace-pre-wrap">
      <span className="text-white">{characters.slice(0, completedCharacters).join("")}</span>
      <span className="text-white/35">{characters.slice(completedCharacters).join("")}</span>
    </span>
  );
}
