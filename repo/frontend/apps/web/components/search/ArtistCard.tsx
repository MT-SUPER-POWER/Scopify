"use client";

import type { MusicArtistResult } from "@scopify/music-domain/search";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";

export function ArtistCard({
  artist,
  onClick,
}: {
  artist: MusicArtistResult;
  onClick?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "group flex min-w-0 flex-col items-center rounded-xl bg-surface-elevated p-4 text-center transition-colors hover:bg-surface-overlay active:bg-surface-sunken",
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
    >
      <div className="mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-surface-sunken shadow-panel">
        {artist.avatarUrl ? (
          <img
            src={getSizedImageUrl(artist.avatarUrl, 400)}
            alt={artist.name}
            className="size-full object-cover"
          />
        ) : (
          <User className="size-12 text-content-subtle" />
        )}
      </div>
      <h4 className="mb-1 w-full truncate text-base font-bold">{artist.name}</h4>
      <p className="mt-1 w-full truncate text-sm text-content-muted">
        {t("search.section.artistLabel")}
      </p>
    </div>
  );
}
