"use client";

import { useMemo, useRef, useState, useEffect, type KeyboardEvent } from "react";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun, type LucideIcon } from "lucide-react";
import { useAppearanceStore } from "@/store/module/appearance";
import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { useThemeOptions } from "@/hooks/settings/useThemeOptions";
import { useI18n } from "@/store/module/i18n";
import type { BackgroundPresetId } from "@/types/appearance/model";
import type { CommandWorkspaceThemeProps } from "@/types/commandWorkspace/model";

export interface CommandWorkspaceThemeItem {
  id: string;
  category: "mode" | "preset";
  label: string;
  summary: string;
  keywords: string;
  active: boolean;
  colors?: { top: string; bottom: string };
  icon?: LucideIcon;
  action(): void;
}

export function useCommandWorkspaceTheme({ onBack, onClose }: CommandWorkspaceThemeProps) {
  const { t } = useI18n();
  const { setTheme, theme, resolvedTheme } = useTheme();
  const applyTheme = useAppearanceStore((state) => state.applyTheme);
  const { palette } = useAppearanceBackground();
  const options = useThemeOptions();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const modeItems: CommandWorkspaceThemeItem[] = useMemo(() => {
    const currentTheme = theme ?? "system";
    return [
      {
        id: "mode:light",
        category: "mode",
        label: `${t("settings.appearance.light")}模式`,
        summary: "始终使用浅色外观",
        keywords: "浅色 亮色 白天 日间 模式 light appearance",
        active: currentTheme === "light",
        icon: Sun,
        action: () => {
          setTheme("light");
          onClose();
        },
      },
      {
        id: "mode:dark",
        category: "mode",
        label: `${t("settings.appearance.dark")}模式`,
        summary: "始终使用深色外观",
        keywords: "深色 暗色 夜间 黑夜 模式 dark appearance",
        active: currentTheme === "dark",
        icon: Moon,
        action: () => {
          setTheme("dark");
          onClose();
        },
      },
      {
        id: "mode:system",
        category: "mode",
        label: t("settings.appearance.system"),
        summary: `根据系统偏好自动切换（当前：${resolvedTheme === "dark" ? "深色" : "浅色"}）`,
        keywords: "跟随系统 自动 系统 默认 system auto appearance",
        active: currentTheme === "system",
        icon: Laptop,
        action: () => {
          setTheme("system");
          onClose();
        },
      },
    ];
  }, [onClose, resolvedTheme, setTheme, t, theme]);

  const presetItems: CommandWorkspaceThemeItem[] = useMemo(() => {
    return options.map((option) => ({
      id: `preset:${option.id}`,
      category: "preset",
      label: option.name,
      summary: option.id.startsWith("user:") ? "自定义配色主题" : "内置背景配色预设",
      keywords: `${option.name} 配色 主题 背景 ${option.id} theme preset color`,
      active: palette.id === option.id,
      colors: { top: option.top, bottom: option.bottom },
      action: () => {
        applyTheme(option.id as BackgroundPresetId);
        onClose();
      },
    }));
  }, [applyTheme, onClose, options, palette.id]);

  const allItems = useMemo(() => [...modeItems, ...presetItems], [modeItems, presetItems]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((item) =>
      `${item.label} ${item.summary} ${item.keywords}`.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Backspace" && !query) {
      event.preventDefault();
      onBack();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (filteredItems.length ? (index + 1) % filteredItems.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) =>
        filteredItems.length ? (index - 1 + filteredItems.length) % filteredItems.length : 0,
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        selected.action();
      }
    }
  };

  return {
    filteredItems,
    handleKeyDown,
    inputRef,
    listRef,
    query,
    selectedIndex,
    setQuery: (val: string) => {
      setQuery(val);
      setSelectedIndex(0);
    },
    setSelectedIndex,
  };
}
