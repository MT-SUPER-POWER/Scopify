"use client";

import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { useFoliaCommands } from "@/hooks/commandWorkspace/useFoliaCommands";
import { COMMAND_WORKSPACE_ROOT_PAGES } from "@/constants/commandWorkspaceRoot";
import { rankCommandWorkspaceEntries } from "@/lib/commandWorkspace/shortcutRanking";
import { isShortcutCommandAvailable } from "@/lib/shortcuts/availability";
import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { useShortcutStore } from "@/store/module/shortcuts";
import { useI18n } from "@/store/module/i18n";
import { useLatticeView } from "@/store/module/lattice";
import { runtime } from "@/lib/runtime";
import type {
  CommandWorkspaceRootItem,
  CommandWorkspaceRootPage,
  CommandWorkspaceRootProps,
} from "@/types/commandWorkspace/model";
import type { ShortcutCommandId } from "@/types/shortcuts";

export function useCommandWorkspaceRoot({
  onClose,
  onLeaveCommand,
  onOpenPage,
}: CommandWorkspaceRootProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const folia = useFoliaCommands(null, query);
  const commands = useShortcutRegistry().commands;
  const executeShortcut = useShortcutCommands();
  const commandWorkspaceUsageCounts = useShortcutStore(
    (state) => state.commandWorkspaceUsageCounts,
  );
  const incrementCommandWorkspaceUsage = useShortcutStore(
    (state) => state.incrementCommandWorkspaceUsage,
  );
  const incrementUsage = useShortcutStore((state) => state.incrementUsage);
  const usageCounts = useShortcutStore((state) => state.usageCounts);
  const latticeActive = useLatticeView((state) => state.active);
  const latticeAvailable = useLatticeView((state) => state.controller !== null);
  const standardItems = useMemo(
    () =>
      rankCommandWorkspaceEntries(
        [
          ...COMMAND_WORKSPACE_ROOT_PAGES.filter(
            (command) => command.page !== "dynamic-island" || runtime.isDesktop,
          ).map((command) => ({
            ...command,
            type: "workspace" as const,
            keywords:
              command.page === "dynamic-island"
                ? "灵动岛 靈動島 dynamic island 开关 动画 回弹 平滑 大小 缩放 翻译 吸附 居中 非遮挡 穿透 置顶"
                : "",
            usageCount: commandWorkspaceUsageCounts[command.page] ?? 0,
          })),
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
              usageCount: usageCounts[command.id] ?? 0,
            })),
        ],
        (command) => command.usageCount,
      ).filter((command) => {
        const text = `${command.label} ${command.keywords}`.toLocaleLowerCase();
        const search = query.trim().toLocaleLowerCase();
        return command.id === "dynamic-island"
          ? search.split(/\s+/).every((term) => text.includes(term))
          : text.includes(search);
      }),
    [commandWorkspaceUsageCounts, commands, latticeActive, latticeAvailable, query, t, usageCounts],
  );

  const items: CommandWorkspaceRootItem[] = [
    ...folia.entries.map((entry) => ({
      id: entry.id,
      label: entry.label,
      summary: entry.path ? `${entry.path} · ${entry.summary}` : entry.summary,
      type: "folia" as const,
      foliaEntry: entry,
      usageCount: 0,
    })),
    ...standardItems,
  ];

  const runShortcut = (commandId: ShortcutCommandId) => {
    incrementUsage(commandId);
    executeShortcut(commandId);
    onClose();
  };

  const runWorkspacePage = (page: CommandWorkspaceRootPage) => {
    incrementCommandWorkspaceUsage(page);
    onOpenPage(page);
  };

  const runSelected = () => {
    const selected = items[selectedIndex];
    if (!selected) return;
    if (selected.foliaEntry) {
      folia.execute(selected.foliaEntry, onOpenPage, onClose);
      return;
    }
    if (selected.type === "workspace" && selected.page) {
      runWorkspacePage(selected.page);
      return;
    }
    runShortcut(selected.id as ShortcutCommandId);
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
      if (item.foliaEntry) folia.execute(item.foliaEntry, onOpenPage, onClose);
      else if (item.type === "workspace" && item.page) runWorkspacePage(item.page);
      else runShortcut(item.id as ShortcutCommandId);
    },
  };
}
