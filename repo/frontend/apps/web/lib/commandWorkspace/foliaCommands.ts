import { FOLIA_LYRIC_COMMANDS } from "@/constants/foliaLyricCommands";
import { buildPersonalFmCommands } from "@/lib/commandWorkspace/personalFmCommands";
import { DESKTOP_FOLIA_VISUALIZER_OPTIONS } from "@/constants/desktopPlaybackController";
import { FOLIA_VISUALIZER_DESCRIPTIONS } from "@/constants/foliaCommandDescriptions";
import type { FoliaCommandEntry, FoliaCommandGroup } from "@/types/foliaCommands";
import type { TranslateFn } from "@/types/i18n.generated";

export function buildFoliaCommands(t: TranslateFn): FoliaCommandEntry[] {
  const entries: Omit<FoliaCommandEntry, "path">[] = [
    ...buildPersonalFmCommands(t),
    ...FOLIA_LYRIC_COMMANDS,
    {
      id: "folia-settings",
      parentId: null,
      label: "Folia 设置",
      summary: "可视化、歌词、视觉设置与主题工作台",
      keywords: "folia settings 配色 外观",
      action: { kind: "group", group: "folia-settings" },
    },
    {
      id: "folia-visualizers",
      parentId: "folia-settings",
      label: "选择可视化",
      summary: "切换 Folia 歌词演出效果",
      keywords: "folia visualizer 渲染器",
      action: { kind: "group", group: "folia-visualizers" },
    },
    {
      id: "folia-visual-settings",
      parentId: "folia-settings",
      label: "视觉设置",
      summary: "通用、歌词、背景与和声字幕",
      keywords: "visual settings 样式",
      action: { kind: "group", group: "folia-visual-settings" },
    },
    {
      id: "folia-theme-library",
      parentId: "folia-settings",
      label: t("folia.options.themeLibrary"),
      summary: "浏览、编辑、导入与应用主题配色",
      keywords: "theme library 主题库 主题工作台",
      action: { kind: "theme" },
    },
    {
      id: "folia-common",
      parentId: "folia-visual-settings",
      label: t("folia.options.previewCommonSettings"),
      summary: "字体、字号、歌词偏移与全局显示",
      keywords: "common font 字体 字号 延迟 同步",
      action: { kind: "settings", section: "common" },
    },
    {
      id: "folia-lyrics",
      parentId: "folia-visual-settings",
      label: "歌词与可视化设置",
      summary: "当前可视化的动画、布局与效果参数",
      keywords: "lyrics visualizer 动画 强度 透明度",
      action: { kind: "settings", section: "visualizer" },
    },
    {
      id: "folia-background",
      parentId: "folia-visual-settings",
      label: "背景设置",
      summary: "背景效果、图片与显示参数",
      keywords: "background 图片 蒙版 暗角",
      action: { kind: "settings", section: "background" },
    },
    {
      id: "folia-subtitle",
      parentId: "folia-visual-settings",
      label: t("folia.options.previewSubtitleSettings"),
      summary: "和声、翻译字幕、字体与字号",
      keywords: "subtitle translation harmony 翻译 字幕 和声",
      action: { kind: "settings", section: "subtitle" },
    },
    ...DESKTOP_FOLIA_VISUALIZER_OPTIONS.map((option) => ({
      id: `folia-mode-${option.value}`,
      parentId: "folia-visualizers" as const,
      label: t(option.labelKey),
      summary: FOLIA_VISUALIZER_DESCRIPTIONS[option.value] ?? "Folia 歌词可视化",
      keywords: `folia visualizer ${option.value}`,
      action: { kind: "visualizer" as const, mode: option.value },
    })),
  ];
  return entries.map((entry) => {
    const parents: string[] = [];
    let parent = entries.find((item) => item.id === entry.parentId);
    while (parent) {
      parents.unshift(parent.label);
      parent = entries.find((item) => item.id === parent?.parentId);
    }
    return { ...entry, path: parents.join(" › ") };
  });
}

export function filterFoliaCommands(
  entries: FoliaCommandEntry[],
  group: FoliaCommandGroup | null,
  query: string,
) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter((entry) => {
    if (!terms.length) return entry.parentId === group;
    if (group) {
      let parent = entry.parentId;
      while (parent && parent !== group)
        parent = entries.find((item) => item.id === parent)?.parentId ?? null;
      if (parent !== group) return false;
    }
    const text =
      `${entry.label} ${entry.summary} ${entry.keywords} ${entry.path}`.toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
