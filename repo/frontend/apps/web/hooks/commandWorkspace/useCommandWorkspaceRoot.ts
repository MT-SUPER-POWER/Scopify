"use client";

import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { useFoliaCommands } from "@/hooks/commandWorkspace/useFoliaCommands";
import { useCommandWorkspaceQuickSettings } from "@/hooks/commandWorkspace/useCommandWorkspaceQuickSettings";
import { COMMAND_WORKSPACE_NAVIGATION_TARGETS } from "@/constants/commandWorkspaceNavigation";
import {
  COMMAND_WORKSPACE_ROOT_PAGE_KEYWORDS,
  COMMAND_WORKSPACE_ROOT_PAGES,
} from "@/constants/commandWorkspaceRoot";
import { searchCommands } from "@/lib/commandWorkspace/commandSearch";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { isShortcutCommandAvailable } from "@/lib/shortcuts/availability";
import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { useShortcutStore } from "@/store/module/shortcuts";
import { useTranslation } from "react-i18next";

import { useLatticeView } from "@/store/module/lattice";
import { runtime } from "@/lib/runtime";
import type {
  CommandWorkspaceRootItem,
  CommandWorkspaceRootProps,
} from "@/types/commandWorkspace/model";
import type { ShortcutCommandId } from "@/types/shortcuts/model";

export function useCommandWorkspaceRoot({
  onClose,
  onLeaveCommand,
  onOpenPage,
}: CommandWorkspaceRootProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const folia = useFoliaCommands(null, "");
  const quickSettings = useCommandWorkspaceQuickSettings();
  const commands = useShortcutRegistry().commands;
  const executeShortcut = useShortcutCommands();
  const smartRouter = useSmartRouter();
  const commandUsage = useShortcutStore((state) => state.commandUsage);
  const recordCommandUsage = useShortcutStore((state) => state.recordCommandUsage);
  const incrementUsage = useShortcutStore((state) => state.incrementUsage);
  const latticeActive = useLatticeView((state) => state.active);
  const latticeAvailable = useLatticeView((state) => state.controller !== null);

  /** 所有可搜索的命令；顺序即无查询、无使用记录时的默认顺序。 */
  const catalog = useMemo<CommandWorkspaceRootItem[]>(
    () => [
      ...folia.catalog.map((entry) => ({
        id: entry.id,
        label: entry.label,
        keywords: entry.keywords,
        path: entry.path,
        summary: entry.path ? `${entry.path} · ${entry.summary}` : entry.summary,
        type: "folia" as const,
        foliaEntry: entry,
      })),
      ...COMMAND_WORKSPACE_ROOT_PAGES.filter(
        (command) => command.page !== "dynamic-island" || runtime.isDesktop,
      ).map((command) => ({
        ...command,
        type: "workspace" as const,
        keywords: COMMAND_WORKSPACE_ROOT_PAGE_KEYWORDS[command.page],
      })),
      ...COMMAND_WORKSPACE_NAVIGATION_TARGETS.map((target) => ({
        id: target.id,
        href: target.href,
        label: "labelKey" in target ? t(target.labelKey) : target.label,
        keywords: target.keywords,
        path: "path" in target ? target.path : undefined,
        summary: "path" in target ? `${target.path} · ${target.summary}` : target.summary,
        type: "navigation" as const,
      })),
      ...(runtime.isDesktop
        ? [
            {
              id: "exit-app",
              label: "退出 Scopify",
              keywords: "退出 关闭 程序 应用 exit quit close app",
              summary: "完全退出应用",
              type: "action" as const,
            },
          ]
        : []),
      ...quickSettings.map((setting) => ({ ...setting, type: "action" as const })),
      ...commands
        .filter((command) => (command.scope ?? "global") === "global")
        .filter((command) => command.showInCommandWorkspace !== false)
        .filter((command) =>
          isShortcutCommandAvailable(command.id, { latticeActive, latticeAvailable }),
        )
        .map((command) => ({
          binding: command.binding,
          id: command.id,
          label: `${t(command.labelKey)}${command.commandWorkspaceLabelSuffix ?? ""}`,
          keywords: command.keywords ?? "",
          summary: "快捷操作",
          type: "shortcut" as const,
        })),
    ],
    [commands, folia.catalog, latticeActive, latticeAvailable, quickSettings, t],
  );

  const items = useMemo(() => {
    // 无查询时只展示 Folia 顶层入口，子项通过分组进入；有查询时所有层级一起参与排序。
    const candidates = query.trim()
      ? catalog
      : catalog.filter((item) => !item.foliaEntry || item.foliaEntry.parentId === null);
    return searchCommands(candidates, (item) => item, query, commandUsage).map((hit) => ({
      ...hit.item,
      labelRanges: hit.labelRanges,
    }));
  }, [catalog, commandUsage, query]);

  const runShortcut = (commandId: ShortcutCommandId) => {
    incrementUsage(commandId);
    executeShortcut(commandId);
    onClose();
  };

  const runItem = (selected: CommandWorkspaceRootItem) => {
    recordCommandUsage(selected.id);
    if (selected.action) {
      selected.action();
      onClose();
      return;
    }
    if (selected.type === "action" && selected.id === "exit-app") {
      onClose();
      runtime.app.exit();
      return;
    }
    if (selected.foliaEntry) {
      folia.execute(selected.foliaEntry, onOpenPage, onClose);
      return;
    }
    if (selected.type === "workspace" && selected.page) {
      onOpenPage(selected.page);
      return;
    }
    if (selected.type === "navigation" && selected.href) {
      onClose();
      smartRouter.push(selected.href);
      return;
    }
    runShortcut(selected.id as ShortcutCommandId);
  };

  const runSelected = () => {
    const selected = items[selectedIndex];
    if (selected) runItem(selected);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Backspace" && !query) {
      event.preventDefault();
      onLeaveCommand();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (items.length ? (index + 1) % items.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => (items.length ? (index - 1 + items.length) % items.length : 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      runSelected();
    }
  };

  return {
    inputRef,
    items,
    query,
    selectedIndex,
    handleKeyDown,
    onQueryChange: (value: string) => {
      setQuery(value);
      setSelectedIndex(0);
    },
    onSelect: (item: CommandWorkspaceRootItem, index: number) => {
      setSelectedIndex(index);
      runItem(item);
    },
  };
}
