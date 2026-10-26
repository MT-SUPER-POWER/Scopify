"use client";

import { FileMusic } from "lucide-react";
import { Card, CardContent } from "@scopify/ui/shadcn/components/card";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useI18n } from "@/store/module/i18n";
import type { SheetSongResultCardProps } from "@/types/components/search";

export function SheetSongResultCard({ song, onSelect }: SheetSongResultCardProps) {
  const { t } = useI18n();
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <button
          type="button"
          onClick={() => onSelect(song)}
          aria-label={`${song.name} · ${t("songResources.openSheets")}`}
          className="flex w-full items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {song.al.picUrl ? (
              <img
                src={getSizedImageUrl(song.al.picUrl, 112)}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              <FileMusic className="size-5 text-muted-foreground" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{song.name}</span>
            <span className="mt-1 block truncate text-xs text-content-muted">
              {song.ar.map((artist) => artist.name).join(" / ")}
            </span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-brand">
              <FileMusic className="size-3.5" />
              {t("songResources.openSheets")}
            </span>
          </span>
        </button>
      </CardContent>
    </Card>
  );
}
