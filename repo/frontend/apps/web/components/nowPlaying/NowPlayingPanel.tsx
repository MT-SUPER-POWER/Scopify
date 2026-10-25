"use client";

import { PanelRightClose } from "lucide-react";
import { NowPlayingHero } from "./NowPlayingHero";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";

/** 主布局右栏：当前歌曲的大封面、艺人与队列信息。 */
export function NowPlayingPanel() {
  const { t } = useI18n();
  const song = usePlayerStore((s) => s.currentSongDetail);
  const setIsOpen = useUiStore((s) => s.setIsNowPlayingPanelOpen);

  return (
    <aside
      aria-label={t("nowPlaying.title")}
      className="flex size-full min-h-0 flex-col overflow-hidden rounded-lg bg-surface-sunken"
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4">
        <h2 className="truncate text-base font-bold text-content">{t("nowPlaying.title")}</h2>
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

      <ScrollArea
        className="min-h-0 flex-1"
        viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
      >
        {song && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <NowPlayingHero song={song} />
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
