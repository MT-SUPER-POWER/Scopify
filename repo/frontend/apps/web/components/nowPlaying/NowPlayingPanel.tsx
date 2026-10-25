"use client";

import { PanelRightClose } from "lucide-react";
import { NowPlayingOverview } from "./NowPlayingOverview";
import { NowPlayingPanelTabs } from "./NowPlayingPanelTabs";
import { NowPlayingQueueView } from "./NowPlayingQueueView";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { NowPlayingPanelView } from "@/types/components/nowPlaying";

/** 主布局右栏：在正在播放信息与播放队列之间切换。 */
export function NowPlayingPanel() {
  const { t } = useI18n();
  const song = usePlayerStore((s) => s.currentSongDetail);
  const isQueueOpen = useUiStore((s) => s.isQueueOpen);
  const tab = useUiStore((s) => s.nowPlayingPanelTab);
  const setIsOpen = useUiStore((s) => s.setIsNowPlayingPanelOpen);
  const view: NowPlayingPanelView = isQueueOpen ? "queue" : tab;

  return (
    <aside
      aria-label={t("nowPlaying.title")}
      className="flex size-full min-h-0 min-w-70 flex-col overflow-hidden rounded-lg bg-surface-sunken"
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4">
        <NowPlayingPanelTabs view={view} />
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label={t("nowPlaying.hide")}
          title={t("nowPlaying.hide")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-content/10 hover:text-content"
        >
          <PanelRightClose className="size-4.5" />
        </button>
      </header>

      {view === "queue" ? <NowPlayingQueueView /> : song && <NowPlayingOverview song={song} />}
    </aside>
  );
}
