"use client";

import { ChevronRight, FileMusic } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { MusicSheetRowProps } from "@/types/songResources/components";

export function MusicSheetRow({ sheet, onSelect }: MusicSheetRowProps) {
  const { t } = useI18n();
  const metadata = [
    sheet.musicKey,
    sheet.difficulty,
    sheet.playVersion,
    sheet.chordName,
    sheet.bpm ? `${sheet.bpm} BPM` : "",
  ].filter(Boolean);
  return (
    <button
      type="button"
      onClick={() => onSelect(sheet)}
      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-content/5 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-elevated text-content-subtle">
        {sheet.coverImageUrl ? (
          <img
            src={sheet.coverImageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover object-top"
          />
        ) : (
          <FileMusic className="size-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-content">{sheet.name}</span>
        <span className="mt-1 block text-xs leading-5 text-content-muted">
          {metadata.join(" · ")}
        </span>
        {sheet.totalPageSize ? (
          <span className="text-xs text-content-subtle">
            {t("songResources.pages", { count: sheet.totalPageSize })}
          </span>
        ) : null}
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-content-subtle" />
    </button>
  );
}
