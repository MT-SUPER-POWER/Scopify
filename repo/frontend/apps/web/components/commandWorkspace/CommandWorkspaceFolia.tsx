"use client";

import { ChevronLeft, Search, X } from "lucide-react";
import { useState } from "react";
import { FoliaCommandList } from "@/components/commandWorkspace/FoliaCommandList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFoliaCommands } from "@/hooks/commandWorkspace/useFoliaCommands";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { CommandWorkspaceFoliaProps } from "@/types/foliaCommands";

export function CommandWorkspaceFolia({
  group,
  onNavigate,
  onBack,
  onClose,
}: CommandWorkspaceFoliaProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { catalog, entries, execute } = useFoliaCommands(group, query);
  const current = catalog.find((entry) => entry.id === group);
  const mode = useLyricStageStore((state) => state.mode);
  const currentMode = catalog.find(
    (entry) => entry.action.kind === "visualizer" && entry.action.mode === mode,
  );
  const back = () => (current?.parentId ? onNavigate(current.parentId) : onBack());
  return (
    <div
      onKeyDown={(event) => {
        if (!event.defaultPrevented && !event.nativeEvent.isComposing && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          back();
        }
      }}
    >
      <div className="flex items-center gap-2 border-b border-white/8 p-4">
        <button
          type="button"
          onClick={back}
          aria-label="返回上一级"
          className="rounded p-1 text-zinc-400 hover:bg-white/10"
        >
          <ChevronLeft className="size-4" />
        </button>
        <Search className="size-4 shrink-0 text-zinc-400" />
        <button
          type="button"
          onClick={back}
          className="flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs text-white"
          aria-label={`返回上一级：${current?.label}`}
        >
          {current?.label}
          <X className="size-3" />
        </button>
        <input
          autoFocus
          value={query}
          aria-label={`搜索${current?.label ?? "Folia"}`}
          placeholder="输入以筛选，然后点击或按回车"
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Escape" || (event.key === "Backspace" && !query)) {
              event.preventDefault();
              event.stopPropagation();
              back();
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setSelectedIndex((index) =>
                entries.length
                  ? (index + (event.key === "ArrowDown" ? 1 : entries.length - 1)) % entries.length
                  : 0,
              );
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const entry = entries[selectedIndex];
              if (entry) execute(entry, onNavigate, onClose);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭搜索"
          className="rounded p-1 text-zinc-400 hover:bg-white/10"
        >
          <X className="size-4" />
        </button>
      </div>
      <ScrollArea className="h-[min(52vh,32rem)]">
        <div className="px-2.5 py-2">
          <div className="flex justify-between gap-3 px-3.5 py-2 text-xs text-zinc-400">
            <span>
              {current?.path ? `${current.path} › ` : ""}
              {current?.label}
            </span>
            {group === "folia-visualizers" ? <span>当前：{currentMode?.label}</span> : null}
          </div>
          <FoliaCommandList
            entries={entries}
            selectedIndex={selectedIndex}
            onHighlight={setSelectedIndex}
            onSelect={(entry) => execute(entry, onNavigate, onClose)}
            showPath={Boolean(query.trim())}
          />
          {!entries.length ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              没有匹配的设置、歌词选项或可视化。
            </p>
          ) : null}
        </div>
      </ScrollArea>
      <footer className="border-t border-white/8 px-5 py-3 text-xs text-zinc-400">
        ↑↓ 选择 · Enter 执行 · Esc 返回上一级
      </footer>
    </div>
  );
}
