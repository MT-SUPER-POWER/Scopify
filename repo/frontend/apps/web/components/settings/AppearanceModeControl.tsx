"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useI18n } from "@/store/module/i18n";
import { SettingRow } from "./SettingsUI";

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
          <Select value={String(appearanceMode)} onValueChange={setTheme}>
            <SelectTrigger aria-label={t("settings.appearance.label")} className="min-w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="light">{t("settings.appearance.light")}</SelectItem>
              <SelectItem value="dark">{t("settings.appearance.dark")}</SelectItem>
              <SelectItem value="system">{t("settings.appearance.system")}</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span aria-hidden className="h-9 w-28 rounded bg-skeleton" />
        )
      }
    />
  );
}
