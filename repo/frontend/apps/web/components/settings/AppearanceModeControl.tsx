"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useI18n } from "@/store/module/i18n";
import { SettingRow, SettingSelect } from "./SettingsUI";

const appearanceModes = ["light", "dark", "system"] as const;

export function AppearanceModeControl() {
  const { t } = useI18n();
  const { setTheme, theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const appearanceMode: (typeof appearanceModes)[number] = appearanceModes.includes(
    theme as (typeof appearanceModes)[number],
  )
    ? (theme as (typeof appearanceModes)[number])
    : "dark";

  return (
    <SettingRow
      label={t("settings.appearance.label")}
      sublabel={t("settings.appearance.sublabel")}
      control={
        isMounted ? (
          <SettingSelect value={appearanceMode} onChange={setTheme}>
            <option value="light" className="bg-popover">
              {t("settings.appearance.light")}
            </option>
            <option value="dark" className="bg-popover">
              {t("settings.appearance.dark")}
            </option>
            <option value="system" className="bg-popover">
              {t("settings.appearance.system")}
            </option>
          </SettingSelect>
        ) : (
          <span aria-hidden className="h-9 w-28 rounded bg-skeleton" />
        )
      }
    />
  );
}
