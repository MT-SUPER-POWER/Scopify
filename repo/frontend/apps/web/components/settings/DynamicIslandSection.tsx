"use client";

import {
  DEFAULT_DYNAMIC_ISLAND_PREFERENCES,
  DYNAMIC_ISLAND_SCALE_OPTIONS,
} from "@/constants/desktopCompanion";
import { useCompanionPreferences } from "@/hooks/desktopCompanion/useCompanionPreferences";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import type { BooleanKeys } from "@/types/desktopCompanion";
import type {
  DynamicIslandPreferences,
  DynamicIslandPreferencesUpdate,
  DynamicIslandTransition,
} from "@/types/dynamicIsland";
import { SettingRow, SettingSection, SettingSelect, Toggle } from "./SettingsUI";

export function DynamicIslandSection() {
  const { t } = useI18n();
  const [stored, setStored] = useCompanionPreferences(
    runtime.dynamicIsland.getPreferences,
    runtime.dynamicIsland.onPreferencesChanged,
  );
  if (!runtime.isDesktop) return null;

  const preferences = stored ?? DEFAULT_DYNAMIC_ISLAND_PREFERENCES;
  const update = (patch: DynamicIslandPreferencesUpdate) => {
    void runtime.dynamicIsland.updatePreferences(patch).then((next) => {
      if (next) setStored(next);
    });
  };
  const toggleRow = (
    key: BooleanKeys<DynamicIslandPreferences>,
    label: string,
    sublabel?: string,
  ) => (
    <SettingRow
      label={label}
      sublabel={sublabel}
      control={
        <Toggle
          enabled={Boolean(preferences[key])}
          onChange={() => update({ [key]: !preferences[key] })}
        />
      }
    />
  );

  return (
    <SettingSection title={t("dynamicIsland.title")}>
      {toggleRow("enabled", t("dynamicIsland.enabled.label"), t("dynamicIsland.enabled.sublabel"))}
      <SettingRow
        label={t("dynamicIsland.transition.label")}
        control={
          <SettingSelect
            value={preferences.transition}
            onChange={(value) => update({ transition: value as DynamicIslandTransition })}
          >
            <option value="bounce">{t("dynamicIsland.transition.bounce")}</option>
            <option value="smooth">{t("dynamicIsland.transition.smooth")}</option>
          </SettingSelect>
        }
      />
      <SettingRow
        label={t("dynamicIsland.scale.label")}
        control={
          <SettingSelect
            value={preferences.scale}
            onChange={(value) => update({ scale: Number(value) })}
          >
            {DYNAMIC_ISLAND_SCALE_OPTIONS.map((scale) => (
              <option key={scale} value={scale}>
                {Math.round(scale * 100)}%
              </option>
            ))}
          </SettingSelect>
        }
      />
      {toggleRow("showTranslation", t("dynamicIsland.showTranslation.label"))}
      {toggleRow(
        "snapCentered",
        t("dynamicIsland.snapCentered.label"),
        t("dynamicIsland.snapCentered.sublabel"),
      )}
      {toggleRow(
        "nonOcclusive",
        t("dynamicIsland.nonOcclusive.label"),
        t("dynamicIsland.nonOcclusive.sublabel"),
      )}
      {toggleRow("alwaysOnTop", t("dynamicIsland.alwaysOnTop.label"))}
    </SettingSection>
  );
}
