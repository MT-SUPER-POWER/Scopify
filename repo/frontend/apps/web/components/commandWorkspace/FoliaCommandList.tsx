"use client";

import { Check, ChevronRight, Palette, RadioTower, Settings2, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { isPersonalFmCommandSelected } from "@/lib/commandWorkspace/personalFmCommands";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaCommandListProps } from "@/types/foliaCommands";

export function FoliaCommandList({
  entries,
  selectedIndex,
  onSelect,
  onHighlight,
  showPath = false,
}: FoliaCommandListProps) {
  const fmSelection = usePersonalFmStore((state) => state.selection);
  const mode = useLyricStageStore((state) => state.mode);
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
            : entry.action.kind === "visualizer" && entry.action.mode === mode;
        const Icon = entry.id.startsWith("personal-fm")
          ? RadioTower
          : entry.action.kind === "visualizer" || entry.id === "folia-visualizers"
            ? Sparkles
            : entry.action.kind === "theme"
              ? Palette
              : Settings2;
        return (
          <button
            key={entry.id}
            type="button"
            data-selected={selectedIndex === index}
            aria-current={active ? "true" : undefined}
            onMouseEnter={() => onHighlight?.(index)}
            onClick={() => onSelect(entry)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors",
              selectedIndex === index ? "bg-white/10" : "hover:bg-white/6",
            )}
          >
            <Icon className="text-primary size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{entry.label}</span>
              <span className="block truncate text-xs text-zinc-400">
                {showPath && entry.path ? `${entry.path} · ` : ""}
                {entry.summary}
              </span>
            </span>
            {active ? (
              <Check aria-label="当前选择" className="text-primary size-4" />
            ) : isGroup ? (
              <ChevronRight aria-hidden className="size-4 text-zinc-500" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
