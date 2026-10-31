"use client";

import { Gauge, Languages, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  PLAYBACK_PROGRESS_REFRESH_RATE_LABEL_KEYS,
  PLAYBACK_PROGRESS_REFRESH_RATES,
} from "@/constants/performance";
import { languageLabelKeys } from "@/lib/i18n";
import { useI18nStore } from "@/store/module/i18n";
import { usePerformanceStore } from "@/store/module/performance";
import { APP_LOCALES } from "@/types/settings/config";
import type { CommandWorkspaceSettingsItem } from "@/types/commandWorkspace/model";

/** Shared immediate actions for root search and the workspace's settings page. */
export function useCommandWorkspaceQuickSettings(): CommandWorkspaceSettingsItem[] {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);
  const refreshRate = usePerformanceStore((state) => state.progressRefreshRate);
  const setRefreshRate = usePerformanceStore((state) => state.setProgressRefreshRate);

  return useMemo(
    () => [
      ...APP_LOCALES.map((value) => ({
        id: `setting:language:${value}`,
        icon: Languages,
        label: `${t("settings.language.label")} · ${t(languageLabelKeys[value])}`,
        summary: t("settings.language.sublabel"),
        keywords: `设置 语言 語言 language locale ${value} ${value === "en-US" ? "英文 英语 English" : value === "zh-CN" ? "中文 简体 简中" : "中文 繁體 繁体 繁中"}`,
        active: locale === value,
        action: () => setLocale(value),
      })),
      ...(["light", "dark", "system"] as const).map((value) => ({
        id: `setting:appearance:${value}`,
        icon: value === "light" ? Sun : value === "dark" ? Moon : Laptop,
        label: t(`settings.appearance.${value}`),
        summary: "切换应用外观，立即生效并保存",
        keywords: `设置 外观 外觀 模式 主题 theme appearance ${value} ${value === "light" ? "浅色 亮色 白天" : value === "dark" ? "深色 暗色 夜间" : "跟随系统 自动"}`,
        active: (theme ?? "system") === value,
        action: () => setTheme(value),
      })),
      ...PLAYBACK_PROGRESS_REFRESH_RATES.map((value) => ({
        id: `setting:progress:${value}`,
        icon: Gauge,
        label: `${t("settings.progressRefreshRate.label")} · ${t(PLAYBACK_PROGRESS_REFRESH_RATE_LABEL_KEYS[value])}`,
        summary: t("settings.progressRefreshRate.sublabel"),
        keywords: `设置 进度 進度 刷新率 帧率 性能 流畅 省电 progress refresh fps performance ${value}`,
        active: refreshRate === value,
        action: () => setRefreshRate(value),
      })),
    ],
    [locale, refreshRate, setLocale, setRefreshRate, setTheme, t, theme],
  );
}
