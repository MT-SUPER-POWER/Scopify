"use client";

import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { CommandWorkspaceIcon } from "@/components/commandWorkspace/CommandWorkspaceIcon";
import { CommandWorkspaceRootInput } from "@/components/commandWorkspace/CommandWorkspaceRootInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { useShortcutStore } from "@/store/module/shortcuts";
import { useI18n } from "@/store/module/i18n";
import type { CommandWorkspacePage } from "@/types/commandWorkspace";
import type { ShortcutCommandId } from "@/types/shortcuts";

interface CommandWorkspaceRootProps {
  onClose(): void;
  onLeaveCommand(): void;
  onOpenPage(page: Exclude<CommandWorkspacePage, "root" | "track-list">): void;
}

const WORKSPACE_COMMANDS = [
  { id: "search", label: "搜索", page: "search", summary: "在面板内查找并操作音乐" },
  {
    id: "now-playing",
    label: "正在播放",
    page: "now-playing",
    summary: "控制当前曲目、进度和音量",
  },
  { id: "queue", label: "播放队列", page: "queue", summary: "播放、调整与移除队列曲目" },
  { id: "settings", label: "设置", page: "settings", summary: "应用、Folia 与桌面播放设置" },
] as const;

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
  const incrementUsage = useShortcutStore((state) => state.incrementUsage);
  const items = useMemo(
    () =>
      [
        ...WORKSPACE_COMMANDS.map((command) => ({ ...command, type: "workspace" as const })),
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
          })),
      ].filter((command) =>
        command.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
      ),
    [commands, query, t],
  );

  const runShortcut = (commandId: ShortcutCommandId) => {
    incrementUsage(commandId);
    executeShortcut(commandId);
    onClose();
  };

  const runSelected = () => {
    const selected = items[selectedIndex];
    if (!selected) return;
    if (selected.type === "workspace") {
      onOpenPage(selected.page);
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
      <ScrollArea className="h-[min(52vh,32rem)]">
        <div className="py-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedIndex(index);
                if (item.type === "workspace") onOpenPage(item.page);
                else runShortcut(item.id as ShortcutCommandId);
              }}
              className={
                selectedIndex === index
                  ? "flex w-full items-center gap-3 bg-white/10 px-5 py-3 text-left"
                  : "flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-white/6"
              }
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/8 text-zinc-300">
                <CommandWorkspaceIcon id={item.id} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{item.label}</span>
                <span className="block truncate text-xs text-zinc-500">{item.summary}</span>
              </span>
              {"binding" in item && item.binding ? (
                <kbd className="text-xs text-zinc-500">{getShortcutBindingLabel(item.binding)}</kbd>
              ) : null}
            </button>
          ))}
          {items.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">没有匹配的命令。</p>
          ) : null}
        </div>
      </ScrollArea>
      <footer className="flex items-center gap-2 border-t border-white/10 bg-black/20 px-5 py-3 text-xs text-zinc-400">
        <kbd className="rounded border border-white/15 bg-white/8 px-1.5 py-0.5 text-zinc-200">
          ?
        </kbd>{" "}
        查看当前页操作<span className="ml-auto">Esc 返回</span>
      </footer>
    </>
  );
}
