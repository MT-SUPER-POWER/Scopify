"use client";

import { FoliaPictureChecks } from "@scopify/ui/scopify/components/folia-panel/picture-grid";
import { FoliaSettingsGroup } from "@scopify/ui/scopify/components/folia-studio/settings";
import { FoliaVisualizerModeGlyph } from "@/components/lyrics/FoliaModeGlyph";
import { useFoliaRandomPool } from "@/hooks/lyrics/useFoliaRandomPool";
import { useTranslation } from "react-i18next";

const picture = (mode: string) => (
  <span className="grid size-full place-items-center text-[color:var(--st-t2)]">
    <FoliaVisualizerModeGlyph mode={mode} size={24} />
  </span>
);

export function FoliaRandomSettingsSection() {
  const { t } = useTranslation();
  const pool = useFoliaRandomPool();
  return (
    <FoliaSettingsGroup title={t("folia.options.randomPool")}>
      <div className="p-3">
        <div className="mb-3 text-right text-xs text-[color:var(--st-t2)]">{pool.countLabel}</div>
        <FoliaPictureChecks
          value={pool.modes}
          options={pool.options}
          picture={picture}
          columns={3}
          onChange={pool.setModes}
          least={1}
          onRefuse={pool.refuse}
          label={t("folia.options.randomPool")}
        />
      </div>
    </FoliaSettingsGroup>
  );
}
