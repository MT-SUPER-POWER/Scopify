"use client";

import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { BackgroundRotation } from "@/types/appearance";
import { AppearanceModeControl } from "./AppearanceModeControl";
import { AppearanceRange } from "./AppearanceRange";
import { BackgroundThemePicker } from "./BackgroundThemePicker";
import { SettingRow, SettingSection, SettingSelect } from "./SettingsUI";

export function BackgroundSettingsSection() {
  const { t } = useI18n();
  const background = useAppearanceStore((state) => state.background);
  const update = useAppearanceStore((state) => state.updateBackground);
  const reset = useAppearanceStore((state) => state.resetBackground);
  return (
    <SettingSection title={t("appearance.background")}>
      <AppearanceModeControl />
      <BackgroundThemePicker />
      <AppearanceRange
        label={t("appearance.intensity")}
        value={background.intensity}
        min={0}
        max={100}
        unit="%"
        onChange={(intensity) => update({ intensity })}
      />
      <AppearanceRange
        label={t("appearance.height")}
        value={background.height}
        min={160}
        max={720}
        step={10}
        unit=" px"
        onChange={(height) => update({ height })}
      />
      <SettingRow
        label={t("appearance.rotation")}
        control={
          <SettingSelect
            value={background.rotation}
            onChange={(rotation) => update({ rotation: rotation as BackgroundRotation })}
          >
            <option className="bg-popover" value="fixed">
              {t("appearance.rotation.fixed")}
            </option>
            <option className="bg-popover" value="daily">
              {t("appearance.rotation.daily")}
            </option>
          </SettingSelect>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <span>{t("appearance.saved")}</span>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded px-2 py-1 text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("appearance.reset")}
        </button>
      </div>
    </SettingSection>
  );
}
