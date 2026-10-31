"use client";

import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useSearchLyricExport } from "@/hooks/search/useSearchLyricExport";
import { useI18n } from "@/store/module/i18n";
import type { SearchLyricActionsProps } from "@/types/search/components";

export function SearchLyricActions({ song }: SearchLyricActionsProps) {
  const { t } = useI18n();
  const exportAction = useSearchLyricExport(song);
  return (
    <div className="flex flex-wrap gap-2" aria-busy={exportAction.isPending}>
      {(["lrc", "yrc"] as const).map((format) => (
        <Button
          key={format}
          type="button"
          variant="outline"
          size="sm"
          disabled={exportAction.isPending}
          onClick={(event) => {
            event.stopPropagation();
            exportAction.mutate(format);
          }}
          className="justify-start gap-2"
        >
          {exportAction.isPending && exportAction.variables === format ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {t(format === "lrc" ? "lyrics.tab.exportLrc" : "lyrics.tab.exportYrc")}
        </Button>
      ))}
    </div>
  );
}
