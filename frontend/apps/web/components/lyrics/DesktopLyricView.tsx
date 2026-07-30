"use client";

import { Heart, MousePointer2, Pause, Pin, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { DesktopLyricCommand, DesktopLyricPreferences } from "@/types/desktopLyric";
import type { LyricDisplayLine } from "@/types/lyrics";

import { useDesktopLyricSnapshot } from "@/hooks/player/useDesktopLyricSnapshot";
import { getWordProgress } from "@/lib/lyrics/timeline";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";

/** Electron-only transparent companion supplied by the shared desktop IPC contract. */
export function DesktopLyricView() {
  const [preferences, setPreferences] = useState<DesktopLyricPreferences | null>(null);
  const { activeLine, currentTimeMs, nextLine, snapshot } = useDesktopLyricSnapshot();

  useEffect(() => {
    document.documentElement.classList.add("desktop-lyrics-html");
    document.body.classList.add("desktop-lyrics-body");
    void runtime.desktopLyrics.getPreferences().then(setPreferences);
    return () => {
      document.documentElement.classList.remove("desktop-lyrics-html");
      document.body.classList.remove("desktop-lyrics-body");
    };
  }, []);

  const sendCommand = (command: DesktopLyricCommand) => {
    runtime.desktopLyrics.sendCommand(command);
  };
  const updatePreferences = (update: Partial<DesktopLyricPreferences>) => {
    void runtime.desktopLyrics.updatePreferences(update).then(setPreferences);
  };
  const title = snapshot?.track?.title ?? "";
  const artistNames = snapshot?.track?.artistNames.join(", ") ?? "";

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
              title="Keep on top"
              aria-label="Keep on top"
              onClick={() => updatePreferences({ alwaysOnTop: !preferences?.alwaysOnTop })}
              className={cn("p-1.5", preferences?.alwaysOnTop ? "text-white" : "text-white/35")}
            >
              <Pin className="size-3.5" />
            </button>
            <button
              type="button"
              title="Click through"
              aria-label="Click through"
              onClick={() => updatePreferences({ clickThrough: !preferences?.clickThrough })}
              className={cn("p-1.5", preferences?.clickThrough ? "text-white" : "text-white/35")}
            >
              <MousePointer2 className="size-3.5" />
            </button>
            <button
              type="button"
              title="Close desktop lyrics"
              aria-label="Close desktop lyrics"
              onClick={() => void runtime.desktopLyrics.close()}
              className="p-1.5 text-white/55 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </header>

        <div className="flex h-34 flex-col justify-center px-4">
          <CompactLyricLine
            currentTimeMs={currentTimeMs}
            line={activeLine}
            showTranslation={true}
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
            title="Previous"
            aria-label="Previous"
            onClick={() => sendCommand({ type: "previous" })}
            className="p-1.5 text-white/75 hover:text-white"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            type="button"
            title="Play or pause"
            aria-label="Play or pause"
            onClick={() => sendCommand({ type: "toggle-play" })}
            className="p-1.5 text-white hover:text-cyan-100"
          >
            {snapshot?.isPlaying ? (
              <Pause className="size-4 fill-current" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
          </button>
          <button
            type="button"
            title="Next"
            aria-label="Next"
            onClick={() => sendCommand({ type: "next" })}
            className="p-1.5 text-white/75 hover:text-white"
          >
            <SkipForward className="size-4" />
          </button>
          <button
            type="button"
            title="Like"
            aria-label="Like"
            onClick={() => sendCommand({ type: "toggle-like" })}
            className={cn(
              "p-1.5",
              snapshot?.isLiked ? "text-rose-300" : "text-white/75 hover:text-white",
            )}
          >
            <Heart className={cn("size-4", snapshot?.isLiked && "fill-current")} />
          </button>
        </footer>
      </section>
    </main>
  );
}

function CompactLyricLine({
  currentTimeMs,
  line,
  showTranslation,
}: {
  currentTimeMs: number;
  line: LyricDisplayLine | null;
  showTranslation: boolean;
}) {
  if (!line)
    return (
      <span className="block text-center text-xl font-semibold text-white/60">
        No lyrics available
      </span>
    );
  return (
    <button
      type="button"
      onClick={() =>
        runtime.desktopLyrics.sendCommand({ positionMs: line.startTimeMs, type: "seek" })
      }
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
