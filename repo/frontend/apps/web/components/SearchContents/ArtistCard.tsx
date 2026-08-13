"use client";

import { User } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { Artist } from "@/types/search";

export function ArtistCard({ artist, onClick }: { artist: Artist; onClick?: () => void }) {
  const { t } = useI18n();

  return (
    <div
      className="bg-surface-elevated hover:bg-surface-overlay active:bg-surface-sunken group flex min-w-0 cursor-pointer flex-col items-center rounded-xl p-4 text-center transition-colors"
      onClick={onClick}
    >
      <div className="bg-surface-sunken shadow-panel mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-full">
        {artist.picUrl || artist.img1v1Url ? (
          <img
            src={artist.picUrl || artist.img1v1Url}
            alt={artist.name}
            className="size-full object-cover"
          />
        ) : (
          <User className="text-content-subtle size-12" />
        )}
      </div>
      <h4 className="mb-1 w-full truncate text-base font-bold">{artist.name}</h4>
      <p className="text-content-muted mt-1 w-full truncate text-sm">
        {t("search.section.artistLabel")}
      </p>
    </div>
  );
}
