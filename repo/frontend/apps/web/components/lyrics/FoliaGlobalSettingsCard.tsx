"use client";

import { Clock3, Film } from "lucide-react";
import { useState } from "react";
import {
  FoliaSettingsGroup,
  FoliaSettingsRow,
  FoliaSettingsToggle,
} from "@scopify/ui/scopify/components/folia-studio/settings";
import { FoliaGlobalLyricOffsetDialog } from "@/components/lyrics/FoliaGlobalLyricOffsetDialog";
import { FoliaVideoExportDialog } from "@/components/lyrics/FoliaVideoExportDialog";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaGlobalSettingsCardProps } from "@/types/lyrics/components";

export function FoliaGlobalSettingsCard({ theme }: FoliaGlobalSettingsCardProps) {
  const { t } = useI18n();
  const [isVideoExportOpen, setIsVideoExportOpen] = useState(false);
  const [isOffsetDialogOpen, setIsOffsetDialogOpen] = useState(false);
  const autoHideCursorWithChrome = useLyricStageStore((state) => state.autoHideCursorWithChrome);
  const patchSettings = useLyricStageStore((state) => state.patchSettings);
  return (
    <>
      <FoliaSettingsGroup title={t("folia.options.lyricsGlobalSettings")}>
        <FoliaSettingsRow label={t("folia.offset.title")} description={t("folia.offset.subtitle")}>
          <button
            aria-label={t("folia.offset.title")}
            title={t("folia.offset.title")}
            type="button"
            onClick={() => setIsOffsetDialogOpen(true)}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--st-fill)] hover:bg-[var(--st-fill2)]"
          >
            <Clock3 size={15} />
          </button>
        </FoliaSettingsRow>
        <FoliaSettingsRow
          label={t("folia.videoExport.title")}
          description={t("folia.videoExport.cardDesc")}
        >
          <button
            aria-label={t("folia.videoExport.title")}
            title={t("folia.videoExport.title")}
            type="button"
            onClick={() => setIsVideoExportOpen(true)}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--st-fill)] hover:bg-[var(--st-fill2)]"
          >
            <Film size={15} />
          </button>
        </FoliaSettingsRow>
        <FoliaSettingsToggle
          label={t("folia.options.autoHideCursorWithChrome")}
          description={t("folia.options.autoHideCursorWithChromeDesc")}
          checked={autoHideCursorWithChrome}
          onChange={(autoHideCursorWithChrome) => patchSettings({ autoHideCursorWithChrome })}
        />
      </FoliaSettingsGroup>
      <FoliaVideoExportDialog
        isOpen={isVideoExportOpen}
        onClose={() => setIsVideoExportOpen(false)}
        theme={theme}
      />
      <FoliaGlobalLyricOffsetDialog
        isOpen={isOffsetDialogOpen}
        onClose={() => setIsOffsetDialogOpen(false)}
        theme={theme}
      />
    </>
  );
}
