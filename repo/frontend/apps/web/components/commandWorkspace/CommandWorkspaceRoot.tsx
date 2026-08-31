"use client";

import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { CommandWorkspaceRootList } from "@/components/commandWorkspace/CommandWorkspaceRootList";
import { CommandWorkspaceRootFooter } from "@/components/commandWorkspace/CommandWorkspaceRootFooter";
import { CommandWorkspaceRootInput } from "@/components/commandWorkspace/CommandWorkspaceRootInput";
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

export function CommandWorkspaceRoot({
  onClose,
  onLeaveCommand,
  onOpenPage,
}: CommandWorkspaceRootProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
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
  const items = useMemo(
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
              (command) => command.id !== "open-command-palette" && command.id !== "open-search",
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
    if (selected.type === "workspace") {
      runWorkspacePage(selected.page);
      return;
    }
    runShortcut(selected.id as ShortcutCommandId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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

  return (
    <>
      <CommandWorkspaceRootInput
        inputRef={inputRef}
        onChange={(nextQuery) => {
          setQuery(nextQuery);
          setSelectedIndex(0);
        }}
        onKeyDown={handleKeyDown}
        query={query}
      />
      <div className="mx-5 h-px bg-white/8" />
      <CommandWorkspaceRootList
        items={items as CommandWorkspaceRootItem[]}
        selectedIndex={selectedIndex}
        onSelect={(item, index) => {
          setSelectedIndex(index);
          if (item.type === "workspace" && item.page) runWorkspacePage(item.page);
          else runShortcut(item.id as ShortcutCommandId);
        }}
      />
      <CommandWorkspaceRootFooter />
    </>
  );
}
