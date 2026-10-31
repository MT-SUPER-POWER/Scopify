"use client";

import { Expand } from "lucide-react";
import { getLyricDisplayText, useCompanionLyricLine } from "@/hooks/lyrics/useCompanionLyricLine";
import { useNowPlayingTint } from "@/hooks/ui/useNowPlayingTint";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { NowPlayingSectionProps } from "@/types/player/nowPlayingComponents";

const PREVIEW_LINE_COUNT = 3;

/** 「歌词预览」：以封面主色为底，滚动展示当前句及其后两句，点击切到面板的歌词视图（Tab 2）。 */
export function NowPlayingLyricsPreview({ song }: NowPlayingSectionProps) {
  const { t } = useI18n();
  const tint = useNowPlayingTint(song);
  const { lines, lastStartedIndex } = useCompanionLyricLine();

  if (lines.length === 0) return null;

  const start = Math.max(0, lastStartedIndex);
  const visible = lines.slice(start, start + PREVIEW_LINE_COUNT);

  const openLyricsTab = () => {
    useUiStore.getState().setNowPlayingPanelTab("lyrics");
  };

  return (
    <section
      className="relative overflow-hidden rounded-lg bg-surface-raised text-content transition-colors duration-500"
      style={tint ? { backgroundColor: tint } : undefined}
    >
      <header className="flex items-center justify-between gap-2 px-4 pt-4">
        <h3 className="truncate text-sm font-bold">{t("nowPlaying.lyricsPreview")}</h3>
        <button
          type="button"
          onClick={openLyricsTab}
          aria-label={t("nowPlaying.tab.lyrics")}
          title={t("nowPlaying.tab.lyrics")}
          className="flex size-7 items-center justify-center rounded-full text-content/70 transition-colors hover:bg-content/10 hover:text-content"
        >
          <Expand className="size-3.5" />
        </button>
      </header>
      <button
        type="button"
        onClick={openLyricsTab}
        className="relative block w-full px-4 pt-2 pb-5 text-left"
      >
        {visible.map((line, offset) => (
          <p
            key={start + offset}
            className={cn(
              "truncate text-xl leading-9 font-bold transition-colors duration-300",
              start + offset === lastStartedIndex ? "text-content" : "text-content/65",
            )}
          >
            {getLyricDisplayText(line)}
          </p>
        ))}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
          style={{
            background: `linear-gradient(to bottom, transparent, ${tint ?? "var(--color-surface-raised)"})`,
          }}
        />
      </button>
    </section>
  );
}
