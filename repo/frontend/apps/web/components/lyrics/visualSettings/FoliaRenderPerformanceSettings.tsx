"use client";

import {
  FoliaSettingsGroup,
  FoliaSettingsRow,
} from "@scopify/ui/scopify/components/folia-studio/settings";
import { Gauge } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FoliaRenderPerformanceDialog } from "@/components/lyrics/visualSettings/FoliaRenderPerformanceDialog";
import type { FoliaRenderPerformanceDialogProps } from "@/types/lyrics/folia/renderPerformance";

export function FoliaRenderPerformanceSettings({
  theme,
}: Pick<FoliaRenderPerformanceDialogProps, "theme">) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <FoliaSettingsGroup title={t("folia.perfCheck.title")}>
      <FoliaSettingsRow
        label={t("folia.perfCheck.start")}
        description={t("folia.perfCheck.description")}
      >
        <button
          aria-label={t("folia.perfCheck.title")}
          title={t("folia.perfCheck.title")}
          type="button"
          onClick={() => setOpen(true)}
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--st-fill)] hover:bg-[var(--st-fill2)]"
        >
          <Gauge size={15} />
        </button>
      </FoliaSettingsRow>
      {open && <FoliaRenderPerformanceDialog onClose={() => setOpen(false)} theme={theme} />}
    </FoliaSettingsGroup>
  );
}
