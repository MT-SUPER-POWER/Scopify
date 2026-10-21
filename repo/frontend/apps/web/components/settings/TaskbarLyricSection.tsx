"use client";

import {
  DEFAULT_TASKBAR_LYRIC_PREFERENCES,
  TASKBAR_LYRIC_FONT_SIZE_OPTIONS,
} from "@/constants/desktopCompanion";
import { useCompanionPreferences } from "@/hooks/desktopCompanion/useCompanionPreferences";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import type { BooleanKeys } from "@/types/desktopCompanion";
import type {
  TaskbarLyricColorMode,
  TaskbarLyricPosition,
  TaskbarLyricPreferencesUpdate,
} from "@/types/taskbarLyric";
import { SettingInput, SettingRow, SettingSection, SettingSelect, Toggle } from "./SettingsUI";

const POSITIONS: TaskbarLyricPosition[] = ["auto", "left", "right"];
const COLOR_MODES: TaskbarLyricColorMode[] = ["taskbar", "taskbarInverse", "light", "dark"];

export function TaskbarLyricSection() {
  const { t } = useI18n();
  const [stored, setStored] = useCompanionPreferences(
    runtime.taskbarLyric.getPreferences,
    runtime.taskbarLyric.onPreferencesChanged,
  );
  if (!runtime.isDesktop) return null;

  if (stored?.supported === false) {
    return (
      <SettingSection title={t("taskbarLyric.title")}>
        <p className="mb-6 text-sm text-muted-foreground">{t("taskbarLyric.unsupported")}</p>
      </SettingSection>
    );
  }

  const preferences = stored ?? DEFAULT_TASKBAR_LYRIC_PREFERENCES;
  const update = (patch: TaskbarLyricPreferencesUpdate) => {
    void runtime.taskbarLyric.updatePreferences(patch).then((next) => {
      if (next) setStored(next);
    });
  };
  const toggleRow = (
    key: BooleanKeys<TaskbarLyricPreferencesUpdate>,
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
  const numberRow = (key: "leftMargin" | "maxWidth" | "rightMargin", label: string) => (
    <SettingRow
      label={label}
      control={
        <SettingInput
          type="number"
          value={preferences[key]}
          onChange={(value) => {
            const next = Number.parseInt(value, 10);
            if (Number.isFinite(next) && next >= 0) update({ [key]: next });
          }}
        />
      }
    />
  );

  return (
    <SettingSection title={t("taskbarLyric.title")}>
      {toggleRow("enabled", t("taskbarLyric.enabled.label"), t("taskbarLyric.enabled.sublabel"))}
      <SettingRow
        label={t("taskbarLyric.position.label")}
        control={
          <SettingSelect
            value={preferences.position}
            onChange={(value) => update({ position: value as TaskbarLyricPosition })}
          >
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {t(`taskbarLyric.position.${position}`)}
              </option>
            ))}
          </SettingSelect>
        }
      />
      {toggleRow(
        "doubleLine",
        t("taskbarLyric.doubleLine.label"),
        t("taskbarLyric.doubleLine.sublabel"),
      )}
      {toggleRow("showTranslation", t("taskbarLyric.showTranslation.label"))}
      {toggleRow("showCover", t("taskbarLyric.showCover.label"))}
      <SettingRow
        label={t("taskbarLyric.colorMode.label")}
        control={
          <SettingSelect
            value={preferences.colorMode}
            onChange={(value) => update({ colorMode: value as TaskbarLyricColorMode })}
          >
            {COLOR_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(`taskbarLyric.colorMode.${mode}`)}
              </option>
            ))}
          </SettingSelect>
        }
      />
      <SettingRow
        label={t("taskbarLyric.fontSize.label")}
        control={
          <SettingSelect
            value={preferences.fontSize}
            onChange={(value) => update({ fontSize: Number(value) })}
          >
            {TASKBAR_LYRIC_FONT_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </SettingSelect>
        }
      />
      {toggleRow("autoMaxWidth", t("taskbarLyric.autoMaxWidth.label"))}
      {!preferences.autoMaxWidth && numberRow("maxWidth", t("taskbarLyric.maxWidth.label"))}
      {toggleRow(
        "autoAdjustOccupiedSpace",
        t("taskbarLyric.autoAdjustOccupiedSpace.label"),
        t("taskbarLyric.autoAdjustOccupiedSpace.sublabel"),
      )}
      {toggleRow("showBackground", t("taskbarLyric.showBackground.label"))}
      {numberRow("leftMargin", t("taskbarLyric.leftMargin.label"))}
      {numberRow("rightMargin", t("taskbarLyric.rightMargin.label"))}
    </SettingSection>
  );
}
