"use client";

import { FoliaSettingsGroup } from "@scopify/ui/scopify/components/folia-studio/settings";
import { useTranslation } from "react-i18next";
import { LyricRenderQualityRows } from "@/components/lyrics/folia/src/components/visualizer/renderQuality/LyricRenderQualityRows";
import { useLyricStageStore } from "@/store/module/lyrics";

export function FoliaRenderQualitySettings() {
  const { t } = useTranslation();
  const value = useLyricStageStore((state) => state.lyricRenderQuality);

  return (
    <FoliaSettingsGroup title={t("folia.options.lyricRenderSection")}>
      <LyricRenderQualityRows
        mode="global"
        value={value}
        onChange={(patch) => {
          const { lyricRenderQuality, patchSettings } = useLyricStageStore.getState();
          patchSettings({ lyricRenderQuality: { ...lyricRenderQuality, ...patch } });
        }}
      />
    </FoliaSettingsGroup>
  );
}
