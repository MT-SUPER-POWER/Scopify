"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { TranslationKey } from "@/lib/i18n";
import { useScratchpadStore } from "@/store/module/scratchpad";
import { useUiStore } from "@/store/module/ui";
import type {
  NowPlayingPanelTabsProps,
  NowPlayingPanelView,
} from "@/types/player/nowPlayingComponents";

const TABS = [
  { view: "overview", labelKey: "nowPlaying.tab.overview" },
  { view: "lyrics", labelKey: "nowPlaying.tab.lyrics" },
  { view: "queue", labelKey: "nowPlaying.tab.queue" },
  { view: "scratchpad", labelKey: "nowPlaying.tab.scratchpad" },
] as const satisfies readonly { view: NowPlayingPanelView; labelKey: TranslationKey }[];

/** 面板顶部的视图切换胶囊。 */
export function NowPlayingPanelTabs({ view, overlay = false }: NowPlayingPanelTabsProps) {
  const { t } = useTranslation();
  const scratchpadCount = useScratchpadStore((s) => s.entries.length);

  const select = (next: NowPlayingPanelView) => {
    const ui = useUiStore.getState();
    if (next === "queue") ui.setIsQueueOpen(true);
    else ui.setNowPlayingPanelTab(next);
  };

  return (
    <div role="tablist" className="scrollbar-none flex min-w-0 items-center gap-1 overflow-x-auto">
      {TABS.map(({ view: tabView, labelKey }) => {
        const isActive = tabView === view;
        const badgeCount = tabView === "scratchpad" && scratchpadCount > 0 ? scratchpadCount : 0;
        return (
          <button
            key={tabView}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => select(tabView)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold whitespace-nowrap transition-colors",
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
            <span>{t(labelKey)}</span>
            {badgeCount > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] leading-4 font-semibold tabular-nums",
                  overlay
                    ? isActive
                      ? "bg-black/15 text-black"
                      : "bg-white/20 text-white"
                    : isActive
                      ? "bg-surface/20 text-surface"
                      : "bg-content/10 text-content-muted",
                )}
              >
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
