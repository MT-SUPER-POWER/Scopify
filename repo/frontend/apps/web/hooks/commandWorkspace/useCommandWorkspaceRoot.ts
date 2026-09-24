"use client";

import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { useFoliaCommands } from "@/hooks/commandWorkspace/useFoliaCommands";
import { COMMAND_WORKSPACE_ROOT_PAGES } from "@/constants/commandWorkspaceRoot";
import { rankCommandWorkspaceEntries } from "@/lib/commandWorkspace/shortcutRanking";
import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { useShortcutStore } from "@/store/module/shortcuts";
import { useI18n } from "@/store/module/i18n";
import type {
  CommandWorkspaceRootItem,
  CommandWorkspaceRootPage,
  CommandWorkspaceRootProps,
} from "@/types/commandWorkspace";
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
  const standardItems = useMemo(
    () =>
      rankCommandWorkspaceEntries(
        [
          ...COMMAND_WORKSPACE_ROOT_PAGES.map((command) => ({
            ...command,
            type: "workspace" as const,
            usageCount: commandWorkspaceUsageCounts[command.page] ?? 0,
          })),
          ...commands
            .filter((command) => (command.scope ?? "global") === "global")
            .filter(
              (command) =>
                command.id !== "open-command-palette" &&
                command.id !== "open-search" &&
                command.id !== "open-folia-settings" &&
                command.id !== "open-folia-theme-library",
            )
            .map((command) => ({
              binding: command.binding,
              id: command.id,
              label: t(command.labelKey),
              summary: "快捷操作",
              type: "shortcut" as const,
              usageCount: usageCounts[command.id] ?? 0,
            })),
        ],
        (command) => command.usageCount,
      ).filter((command) =>
        command.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
      ),
    [commandWorkspaceUsageCounts, commands, query, t, usageCounts],
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
