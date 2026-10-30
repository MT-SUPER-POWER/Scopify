"use client";

import { Check, ChevronRight } from "lucide-react";
import { getFoliaCommandIcon } from "@/constants/foliaCommandIcons";
import { useFoliaCommandSelection } from "@/hooks/commandWorkspace/useFoliaCommandSelection";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { isPersonalFmCommandSelected } from "@/lib/commandWorkspace/personalFmCommands";
import { usePersonalFmStore } from "@/store/module/personalFm";
import type { FoliaCommandListProps } from "@/types/lyrics/folia/commands";

export function FoliaCommandList({
  entries,
  selectedIndex,
  onSelect,
  onHighlight,
  showPath = false,
}: FoliaCommandListProps) {
  const fmSelection = usePersonalFmStore((state) => state.selection);
  const selection = useFoliaCommandSelection(entries);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);
  return (
    <div ref={listRef} className="space-y-0.5">
      {entries.map((entry, index) => {
        const isGroup = entry.action.kind === "group";
        const active =
          entry.action.kind === "personal-fm"
            ? isPersonalFmCommandSelected(entry.action, fmSelection)
            : selection[index];
        const isToggle = entry.action.kind === "lyric-toggle";
        const Icon = getFoliaCommandIcon(entry.id);
        return (
          <button
            key={entry.id}
            type="button"
            data-selected={selectedIndex === index}
            aria-current={!isToggle && active ? "true" : undefined}
            aria-pressed={isToggle ? active : undefined}
            onMouseEnter={() => onHighlight?.(index)}
            onClick={() => onSelect(entry)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors",
              selectedIndex === index ? "bg-content/10" : "hover:bg-content/6",
            )}
          >
            <Icon className="size-4 shrink-0 text-content" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-content">{entry.label}</span>
              <span className="block truncate text-xs text-content-muted">
                {showPath && entry.path ? `${entry.path} · ` : ""}
                {entry.summary}
              </span>
            </span>
            {isToggle ? (
              <span className="flex shrink-0 items-center gap-2 text-xs text-content-muted">
                {active ? "已开启" : "已关闭"}
                <span
                  aria-hidden
                  className={cn(
                    "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
                    active ? "bg-content/80" : "bg-content/15",
                  )}
                >
                  <span
                    className={cn(
                      "size-4 rounded-full transition-transform",
                      active ? "translate-x-4 bg-surface-overlay" : "bg-content/60",
                    )}
                  />
                </span>
              </span>
            ) : active ? (
              <Check aria-label="当前选择" className="size-4 text-content" />
            ) : isGroup ? (
              <ChevronRight aria-hidden className="size-4 text-content-muted" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
