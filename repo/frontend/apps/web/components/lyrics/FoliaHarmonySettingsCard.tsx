"use client";

import {
  FoliaSettingsGroup,
  FoliaSettingsToggle,
} from "@scopify/ui/scopify/components/folia-studio/settings";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaHarmonySettingsCardProps } from "@/types/lyrics/components";

export function FoliaHarmonySettingsCard({ className }: FoliaHarmonySettingsCardProps) {
  const { t } = useI18n();
  const show = useLyricStageStore((state) => state.showHarmonySubtitle);
  const background = useLyricStageStore((state) => state.harmonySubtitleBackground);
  const patch = useLyricStageStore((state) => state.patchSettings);
  return (
    <div className={className}>
      <FoliaSettingsGroup title={t("folia.options.harmonySettings")}>
        <FoliaSettingsToggle
          label={t("folia.options.showHarmonySubtitle")}
          checked={show}
          onChange={(showHarmonySubtitle) => patch({ showHarmonySubtitle })}
        />
        <FoliaSettingsToggle
          label={t("folia.options.harmonySubtitleBackground")}
          checked={background}
          onChange={(harmonySubtitleBackground) => patch({ harmonySubtitleBackground })}
        />
      </FoliaSettingsGroup>
    </div>
  );
}
