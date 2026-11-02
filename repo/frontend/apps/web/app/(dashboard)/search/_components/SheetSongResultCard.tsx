"use client";

import { ChevronRight, FileMusic } from "lucide-react";
import { Card, CardContent } from "@scopify/ui/shadcn/components/card";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useTranslation } from "react-i18next";

import type { MusicSheet } from "@/types/songResources/api";
import type { SheetSongResultCardProps } from "@/types/search/components";

const VISIBLE_SHEETS = 3;

function getSheetMeta(sheet: MusicSheet) {
  return [sheet.musicKey, sheet.difficulty, sheet.playVersion].filter(Boolean).join(" · ");
}

export function SheetSongResultCard({
  song,
  sheets,
  onSelectSong,
  onSelectSheet,
}: SheetSongResultCardProps) {
  const { t } = useTranslation();
  const hiddenCount = sheets.length - VISIBLE_SHEETS;
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="space-y-4 p-4">
        <button
          type="button"
          onClick={() => onSelectSong(song)}
          aria-label={`${song.name} · ${t("songResources.openSheets")}`}
          className="flex w-full items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {song.al.picUrl ? (
              <img
                src={getSizedImageUrl(song.al.picUrl, 96)}
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
            <span className="mt-0.5 block truncate text-xs text-content-muted">
              {song.ar.map((artist) => artist.name).join(" / ")}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-brand">
            {t("songResources.sheetCount", { count: sheets.length })}
            <ChevronRight aria-hidden className="size-3.5" />
          </span>
        </button>
        <ul className="grid grid-cols-3 gap-3">
          {sheets.slice(0, VISIBLE_SHEETS).map((sheet) => (
            <li key={sheet.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelectSheet(sheet)}
                aria-label={`${sheet.name} · ${t("songResources.preview")}`}
                className="group block w-full text-left outline-none"
              >
                <span className="relative flex aspect-3/4 items-center justify-center overflow-hidden rounded-md border border-border bg-muted transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  {sheet.coverImageUrl ? (
                    <img
                      src={sheet.coverImageUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover object-top"
                    />
                  ) : (
                    <FileMusic className="size-6 text-muted-foreground" />
                  )}
                  {sheet.totalPageSize ? (
                    <span className="absolute right-1 bottom-1 rounded bg-overlay/60 px-1.5 py-0.5 text-[10px] leading-none text-overlay-foreground">
                      {t("songResources.pages", { count: sheet.totalPageSize })}
                    </span>
                  ) : null}
                </span>
                <span className="mt-2 block truncate text-xs font-medium">{sheet.name}</span>
                <span className="block truncate text-[11px] text-content-muted">
                  {getSheetMeta(sheet) || " "}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => onSelectSong(song)}
            className="w-full rounded-lg bg-content/5 py-2 text-xs text-content-muted transition-colors hover:bg-content/10 hover:text-content"
          >
            {t("songResources.moreSheets", { count: hiddenCount })}
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
