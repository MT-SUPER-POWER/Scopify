"use client";

import { useState } from "react";
import { NowPlayingCard } from "./NowPlayingCard";
import { SongResourcesDialog } from "@/components/songResources/SongResourcesDialog";
import { SongWikiSection } from "@/components/songResources/SongWikiSection";
import { SongSheetsSection } from "@/components/songResources/SongSheetsSection";
import { useI18n } from "@/store/module/i18n";
import type { NowPlayingSectionProps } from "@/types/player/nowPlayingComponents";
import type { SongResourceTab } from "@/types/songResources/components";

export function NowPlayingSongResources({ song }: NowPlayingSectionProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<SongResourceTab>("sheets");
  const [open, setOpen] = useState(false);
  if (song.id <= 0) return null;
  const show = (next: SongResourceTab) => {
    setTab(next);
    setOpen(true);
  };
  return (
    <>
      <NowPlayingCard
        title={t("songResources.wiki")}
        action={
          <button
            type="button"
            onClick={() => show("wiki")}
            className="text-xs text-content-muted hover:text-content"
          >
            {t("songResources.more")}
          </button>
        }
      >
        <div className="p-4">
          <SongWikiSection songId={song.id} compact />
        </div>
      </NowPlayingCard>
      <NowPlayingCard
        title={t("songResources.sheets")}
        action={
          <button
            type="button"
            onClick={() => show("sheets")}
            className="text-xs text-content-muted hover:text-content"
          >
            {t("songResources.more")}
          </button>
        }
      >
        <div className="p-2">
          <SongSheetsSection songId={song.id} compact />
        </div>
      </NowPlayingCard>
      <SongResourcesDialog song={song} initialTab={tab} open={open} onOpenChange={setOpen} />
    </>
  );
}
