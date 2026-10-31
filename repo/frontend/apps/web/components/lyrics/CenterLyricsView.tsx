"use client";

import { IconLetterF } from "@tabler/icons-react";
import { Minimize2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLyricDisplayText, useCompanionLyricLine } from "@/hooks/lyrics/useCompanionLyricLine";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { useCoverThemeColor } from "@/hooks/playlist/useCoverThemeColor";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";

import { useUiStore } from "@/store/module/ui";

const MANUAL_SCROLL_HOLD_MS = 3_000;

interface CenterLyricsViewProps {
  onClose: () => void;
}

/**
 * 屏幕中心歌词视图：填充主内容区（保留左侧侧边栏），
 * 提取歌曲封面主色作为背景，大字号居中滚动歌词，轻量且沉浸。
 */
export function CenterLyricsView({ onClose }: CenterLyricsViewProps) {
  const { t } = useTranslation();
  const song = usePlayerStore((s) => s.currentSongDetail);
  const commands = usePlaybackCommands();
  const { lines, lastStartedIndex } = useCompanionLyricLine();
  const viewportRef = useRef<HTMLDivElement>(null);
  const manualScrollAtRef = useRef(0);

  const artworkUrl = resolveCoverUrl(song?.al?.picUrl, song?.al?.coverUrl);
  const coverColor = useCoverThemeColor(artworkUrl ? getSizedImageUrl(artworkUrl, 100) : null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || lastStartedIndex < 0) return;
    if (performance.now() - manualScrollAtRef.current < MANUAL_SCROLL_HOLD_MS) return;
    const line = viewport.querySelector<HTMLElement>(`[data-lyric-index="${lastStartedIndex}"]`);
    if (!line) return;

    viewport.scrollTo({
      top: line.offsetTop - viewport.clientHeight * 0.42,
      behavior: "smooth",
    });
  }, [lastStartedIndex]);

  const markManualScroll = () => {
    manualScrollAtRef.current = performance.now();
  };

  const handleOpenFolia = () => {
    useUiStore.getState().setIsLyricsOpen(true);
  };

  return (
    <div
      role="region"
      aria-label={t("nowPlaying.tab.lyrics")}
      className="relative flex size-full flex-col overflow-hidden bg-surface-raised transition-colors duration-700 select-none"
      style={
        coverColor
          ? {
              background: `linear-gradient(180deg, ${coverColor} 0%, color-mix(in oklab, ${coverColor} 40%, #050505) 100%)`,
            }
          : undefined
      }
    >
      {/* 顶部工具栏 */}
      <header className="relative z-10 flex h-14 shrink-0 items-center justify-between px-6 pt-2">
        <div className="flex min-w-0 items-center gap-2">
          {song && (
            <div className="truncate">
              <span className="truncate text-sm font-bold text-white drop-shadow-sm">
                {song.name}
              </span>
              {song.ar && song.ar.length > 0 && (
                <span className="ml-2 truncate text-xs text-white/70">
                  {song.ar.map((a) => a.name).join(", ")}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenFolia}
            aria-label={t("nowPlaying.openFoliaStage")}
            title={t("nowPlaying.openFoliaStage")}
            className="flex size-8 items-center justify-center rounded-full bg-black/25 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/45 hover:text-white"
          >
            <IconLetterF size={18} stroke={2.2} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("nowPlaying.closeLyrics")}
            title={t("nowPlaying.closeLyrics")}
            className="flex size-8 items-center justify-center rounded-full bg-black/25 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/45 hover:text-white"
          >
            <Minimize2 className="size-4.5" />
          </button>
        </div>
      </header>

      {/* 歌词主滚动区域 */}
      {lines.length === 0 ? (
        <div className="m-auto flex flex-col items-center justify-center px-6 text-center text-xl font-bold text-white/70">
          <p>{t("nowPlaying.lyricsEmpty")}</p>
        </div>
      ) : (
        <ScrollArea
          viewportRef={viewportRef}
          className="size-full flex-1"
          viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
        >
          <ol
            onWheel={markManualScroll}
            onTouchMove={markManualScroll}
            className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 pt-[22vh] pb-[35vh]"
          >
            {lines.map((line, index) => {
              const isActive = index === lastStartedIndex;
              const isPassed = index < lastStartedIndex;

              return (
                <li key={index} data-lyric-index={index} className="w-full text-center">
                  <button
                    type="button"
                    onClick={() => void commands.seek(Math.round(line.startTime * 1_000))}
                    className={cn(
                      "group w-full cursor-pointer text-center transition-all duration-300 focus-visible:outline-none",
                      isActive
                        ? "scale-1.03 text-3xl font-black text-white opacity-100 drop-shadow-md md:text-4xl lg:text-5xl"
                        : cn(
                            "text-2xl font-bold md:text-3xl lg:text-4xl",
                            isPassed
                              ? "text-white/40 hover:text-white/80"
                              : "text-white/45 hover:text-white/80",
                          ),
                    )}
                  >
                    <span className="block leading-snug">{getLyricDisplayText(line)}</span>
                    {line.translation && (
                      <span
                        className={cn(
                          "mt-2 block leading-normal font-medium transition-opacity duration-300",
                          isActive
                            ? "text-lg text-white/85 md:text-xl lg:text-2xl"
                            : "text-base text-white/35 group-hover:text-white/70 md:text-lg lg:text-xl",
                        )}
                      >
                        {line.translation}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </ScrollArea>
      )}
    </div>
  );
}
