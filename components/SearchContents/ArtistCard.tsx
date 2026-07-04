"use client";

import { User } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { Artist } from "@/types/search";

export function ArtistCard({ artist, onClick }: { artist: Artist; onClick?: () => void }) {
  const { t } = useI18n();

  return (
    <div
      className="group flex cursor-pointer flex-col items-center rounded-xl bg-[#181818] p-4 text-center transition-colors hover:bg-[#282828] active:bg-[#202020]"
      onClick={onClick}
    >
      <div className="mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-zinc-800 shadow-lg">
        {artist.picUrl || artist.img1v1Url ? (
          <img
            src={artist.picUrl || artist.img1v1Url}
            alt={artist.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-12 w-12 text-zinc-500" />
        )}
      </div>
      <h4 className="mb-1 w-full truncate text-base font-bold">{artist.name}</h4>
      <p className="mt-1 w-full truncate text-sm text-zinc-400">
        {t("search.section.artistLabel")}
      </p>
    </div>
  );
}
