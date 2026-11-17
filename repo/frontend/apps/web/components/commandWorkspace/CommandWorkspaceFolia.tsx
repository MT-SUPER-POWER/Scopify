"use client";

import { ChevronLeft, Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FoliaCommandList } from "@/components/commandWorkspace/FoliaCommandList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFoliaCommands } from "@/hooks/commandWorkspace/useFoliaCommands";
import { useFoliaPlaybackControlsStore } from "@/store/module/foliaPlaybackControls";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { CommandWorkspaceFoliaProps, FoliaCommandEntry } from "@/types/lyrics/folia/commands";

export function CommandWorkspaceFolia({
  group,
  onNavigate,
  onBack,
  onClose,
}: CommandWorkspaceFoliaProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { catalog, entries, execute } = useFoliaCommands(group, query);
  const current = catalog.find((entry) => entry.id === group);
  const mode = useLyricStageStore((state) => state.mode);
  const currentMode = catalog.find(
    (entry) => entry.action.kind === "visualizer" && entry.action.mode === mode,
  );
  const isVisualizerPicker = group === "folia-visualizers";
  const capsuleLaunch = useFoliaPlaybackControlsStore((state) => state.commandWorkspaceLaunch);
  const shouldFocusInput =
    !capsuleLaunch ||
    typeof window === "undefined" ||
    !window.matchMedia("(pointer: coarse)").matches;
  const keepOpen = useFoliaPlaybackControlsStore((state) => state.visualizerPickerKeepOpen);
  const setKeepOpen = useFoliaPlaybackControlsStore((state) => state.setVisualizerPickerKeepOpen);
  const selectEntry = (entry: FoliaCommandEntry) => {
    const stay = isVisualizerPicker && keepOpen && entry.action.kind === "visualizer";
    execute(entry, onNavigate, stay ? () => undefined : onClose);
    if (stay && shouldFocusInput) inputRef.current?.focus();
  };
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
      <div className="flex items-center gap-2 border-b border-border p-4">
        <button
          type="button"
          onClick={back}
          aria-label="返回上一级"
          className="rounded p-1 text-content-muted hover:bg-content/10"
        >
          <ChevronLeft className="size-4" />
        </button>
        <Search className="size-4 shrink-0 text-content-muted" />
        <button
          type="button"
          onClick={back}
          className="flex shrink-0 items-center gap-1 rounded-md bg-content/10 px-2 py-1 text-xs text-content"
          aria-label={`返回上一级：${current?.label}`}
        >
          {current?.label}
          <X className="size-3" />
        </button>
        <input
          autoFocus={shouldFocusInput}
          ref={inputRef}
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
              if (entry) selectEntry(entry);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-content outline-none placeholder:text-content-muted"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭搜索"
          className="rounded p-1 text-content-muted hover:bg-content/10"
        >
          <X className="size-4" />
        </button>
      </div>
      <ScrollArea
        className="h-[min(52vh,32rem)]"
        viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
      >
        <div className="px-2.5 py-2">
          <div className="flex justify-between gap-3 px-3.5 py-2 text-xs text-content-muted">
            <span>
              {current?.path ? `${current.path} › ` : ""}
              {current?.label}
              {isVisualizerPicker && currentMode ? ` · ${currentMode.label}` : null}
            </span>
            {isVisualizerPicker ? (
              <label className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-current"
                  checked={keepOpen}
                  onChange={(event) => setKeepOpen(event.target.checked)}
                />
                {t("folia.options.visualizerPickerKeepOpen")}
              </label>
            ) : null}
          </div>
          <FoliaCommandList
            entries={entries}
            selectedIndex={selectedIndex}
            onHighlight={setSelectedIndex}
            onSelect={selectEntry}
            showPath={Boolean(query.trim())}
          />
          {!entries.length ? (
            <p className="py-10 text-center text-sm text-content-muted">
              没有匹配的设置、歌词选项或可视化。
            </p>
          ) : null}
        </div>
      </ScrollArea>
      <footer className="border-t border-border px-5 py-3 text-xs text-content-muted">
        ↑↓ 选择 · Enter 执行 · Esc 返回上一级
      </footer>
    </div>
  );
}
