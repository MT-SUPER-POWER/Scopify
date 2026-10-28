"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type {
  NowPlayingPanelTabsProps,
  NowPlayingPanelView,
} from "@/types/player/nowPlayingComponents";

const TABS = [
  { view: "overview", labelKey: "nowPlaying.tab.overview" },
  { view: "lyrics", labelKey: "nowPlaying.tab.lyrics" },
  { view: "queue", labelKey: "nowPlaying.tab.queue" },
] as const satisfies readonly { view: NowPlayingPanelView; labelKey: string }[];

/** 面板顶部的视图切换胶囊。 */
export function NowPlayingPanelTabs({ view, overlay = false }: NowPlayingPanelTabsProps) {
  const { t } = useI18n();

  const select = (next: NowPlayingPanelView) => {
    const ui = useUiStore.getState();
    if (next === "queue") ui.setIsQueueOpen(true);
    else ui.setNowPlayingPanelTab(next);
  };

  return (
    <div role="tablist" className="flex min-w-0 items-center gap-1">
      {TABS.map(({ view: tabView, labelKey }) => {
        const isActive = tabView === view;
        return (
          <button
            key={tabView}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => select(tabView)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-sm font-bold transition-colors",
              // 浮在封面上时用半透明深色胶囊，保证在任意封面上可读
              overlay
                ? isActive
                  ? "bg-white text-black"
                  : "bg-black/35 text-white backdrop-blur-sm hover:bg-black/50"
                : isActive
                  ? "bg-content text-surface"
                  : "bg-content/8 text-content hover:bg-content/15",
            )}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
