"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";

import {
  DEFAULT_DYNAMIC_ISLAND_PREFERENCES,
  DYNAMIC_ISLAND_SCALE_OPTIONS,
} from "@/constants/desktopCompanion";
import { useCompanionPreferences } from "@/hooks/desktopCompanion/useCompanionPreferences";
import { runtime } from "@/lib/runtime";
import { useTranslation } from "react-i18next";

import type { BooleanKeys } from "@/types/desktop/companion";
import type {
  DynamicIslandPreferences,
  DynamicIslandPreferencesUpdate,
  DynamicIslandTransition,
} from "@/types/desktop/dynamicIsland";
import { SettingRow, SettingSection, Toggle } from "./SettingsUI";

export function DynamicIslandSection() {
  const { t } = useTranslation();
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
          <Select
            value={String(preferences.transition)}
            onValueChange={(value) => update({ transition: value as DynamicIslandTransition })}
          >
            <SelectTrigger aria-label={t("dynamicIsland.transition.label")} className="min-w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="bounce">{t("dynamicIsland.transition.bounce")}</SelectItem>
              <SelectItem value="smooth">{t("dynamicIsland.transition.smooth")}</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <SettingRow
        label={t("dynamicIsland.scale.label")}
        control={
          <Select
            value={String(preferences.scale)}
            onValueChange={(value) => update({ scale: Number(value) })}
          >
            <SelectTrigger aria-label={t("dynamicIsland.scale.label")} className="min-w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {DYNAMIC_ISLAND_SCALE_OPTIONS.map((scale) => (
                <SelectItem key={scale} value={String(scale)}>
                  {Math.round(scale * 100)}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
