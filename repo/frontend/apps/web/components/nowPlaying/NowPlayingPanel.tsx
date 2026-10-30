"use client";

import { PanelRightClose } from "lucide-react";
import { useState } from "react";
import { NowPlayingLyricsView } from "./NowPlayingLyricsView";
import { NowPlayingOverview } from "./NowPlayingOverview";
import { NowPlayingPanelTabs } from "./NowPlayingPanelTabs";
import { NowPlayingQueueView } from "./NowPlayingQueueView";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { NowPlayingPanelView } from "@/types/player/nowPlayingComponents";

/**
 * 主布局右栏：在正在播放信息、滚动歌词与播放队列之间切换。
 * 正在播放视图下顶栏浮在封面上（与 Spotify 一致，不再单独占一条），滚过封面后变为实色。
 */
export function NowPlayingPanel() {
  const { t } = useI18n();
  const song = usePlayerStore((s) => s.currentSongDetail);
  const isQueueOpen = useUiStore((s) => s.isQueueOpen);
  const tab = useUiStore((s) => s.nowPlayingPanelTab);
  const setIsOpen = useUiStore((s) => s.setIsNowPlayingPanelOpen);
  const view: NowPlayingPanelView = isQueueOpen ? "queue" : tab;
  const [isOverCover, setIsOverCover] = useState(true);
  const isFloating = view === "overview" && Boolean(song);
  const isOverlay = isFloating && isOverCover;

  return (
    <aside
      aria-label={t("nowPlaying.title")}
      className="relative flex size-full min-h-0 min-w-70 flex-col overflow-hidden rounded-lg bg-surface-raised dark:bg-surface-sunken"
    >
      <header
        className={cn(
          "flex h-14 shrink-0 items-center justify-between gap-2 px-4 transition-[background-color,box-shadow] duration-200",
          isFloating && "absolute inset-x-0 top-0 z-10",
          isFloating &&
            (isOverCover
              ? "bg-linear-to-b from-black/50 to-transparent"
              : "bg-surface-raised/95 shadow-sm backdrop-blur-md dark:bg-surface-sunken/95"),
        )}
      >
        <NowPlayingPanelTabs view={view} overlay={isOverlay} />
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label={t("nowPlaying.hide")}
          title={t("nowPlaying.hide")}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
            isOverlay
              ? "text-white/85 hover:bg-black/30 hover:text-white"
              : "text-content-muted hover:bg-content/10 hover:text-content",
          )}
        >
          <PanelRightClose className="size-4.5" />
        </button>
      </header>

      {view === "queue" ? (
        <NowPlayingQueueView />
      ) : (
        song &&
        (view === "lyrics" ? (
          <NowPlayingLyricsView song={song} />
        ) : (
          <NowPlayingOverview song={song} onCoverVisibleChange={setIsOverCover} />
        ))
      )}
    </aside>
  );
}
