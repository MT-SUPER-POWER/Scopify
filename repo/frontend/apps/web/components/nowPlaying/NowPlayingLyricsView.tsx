"use client";

import { IconLetterF } from "@tabler/icons-react";
import { Maximize2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLyricDisplayText, useCompanionLyricLine } from "@/hooks/lyrics/useCompanionLyricLine";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { useNowPlayingTint } from "@/hooks/ui/useNowPlayingTint";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { NowPlayingSectionProps } from "@/types/player/nowPlayingComponents";

/** 用户手动滚动后，暂停自动跟随的时长。 */
const MANUAL_SCROLL_HOLD_MS = 3_000;

/** 面板的歌词视图：封面主色铺底的滚动歌词，当前句自动居上，点击任意一句跳转；右上角提供 Folia 舞台与全局轻量歌词双入口。 */
export function NowPlayingLyricsView({ song }: NowPlayingSectionProps) {
  const { t } = useI18n();
  const tint = useNowPlayingTint(song);
  const commands = usePlaybackCommands();
  const { lines, lastStartedIndex } = useCompanionLyricLine();
  const viewportRef = useRef<HTMLDivElement>(null);
  const manualScrollAtRef = useRef(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || lastStartedIndex < 0) return;
    if (performance.now() - manualScrollAtRef.current < MANUAL_SCROLL_HOLD_MS) return;
    const line = viewport.querySelector<HTMLElement>(`[data-lyric-index="${lastStartedIndex}"]`);
    if (!line) return;
    viewport.scrollTo({
      top: line.offsetTop - viewport.clientHeight * 0.3,
      behavior: "smooth",
    });
  }, [lastStartedIndex]);

  const markManualScroll = () => {
    manualScrollAtRef.current = performance.now();
  };

  const openCenterLyrics = () => {
    const ui = useUiStore.getState();
    ui.setIsCenterLyricsOpen(true);
    ui.setIsNowPlayingPanelOpen(false);
  };

  const openFoliaStage = () => {
    useUiStore.getState().setIsLyricsOpen(true);
  };

  return (
    <div
      className="relative mx-2 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-surface-raised text-content transition-colors duration-500"
      style={tint ? { backgroundColor: tint } : undefined}
    >
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={openFoliaStage}
          aria-label={t("nowPlaying.openFoliaStage")}
          title={t("nowPlaying.openFoliaStage")}
          className="flex size-8 items-center justify-center rounded-full bg-content/5 text-content/80 transition-colors hover:bg-content/10 hover:text-content"
        >
          <IconLetterF size={16} stroke={2.2} />
        </button>
        <button
          type="button"
          onClick={openCenterLyrics}
          aria-label={t("nowPlaying.lyricsCenterView")}
          title={t("nowPlaying.lyricsCenterView")}
          className="flex size-8 items-center justify-center rounded-full bg-content/5 text-content/80 transition-colors hover:bg-content/10 hover:text-content"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>

      {lines.length === 0 ? (
        <p className="m-auto px-6 text-center text-lg font-bold text-content/70">
          {t("nowPlaying.lyricsEmpty")}
        </p>
      ) : (
        <ScrollArea
          viewportRef={viewportRef}
          className="min-h-0 flex-1"
          viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
        >
          <ol
            onWheel={markManualScroll}
            onTouchMove={markManualScroll}
            className="relative flex flex-col gap-4 px-5 pt-8 pb-[40%]"
          >
            {lines.map((line, index) => (
              <li key={index} data-lyric-index={index}>
                <button
                  type="button"
                  onClick={() => void commands.seek(Math.round(line.startTime * 1_000))}
                  className={cn(
                    "text-left text-xl leading-snug font-bold transition-colors duration-300 hover:text-content",
                    index === lastStartedIndex
                      ? "text-content"
                      : index < lastStartedIndex
                        ? "text-content/55"
                        : "text-content/60",
                  )}
                >
                  {getLyricDisplayText(line)}
                  {line.translation && (
                    <span className="mt-1 block text-sm font-medium opacity-80">
                      {line.translation}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </ScrollArea>
      )}
    </div>
  );
}
