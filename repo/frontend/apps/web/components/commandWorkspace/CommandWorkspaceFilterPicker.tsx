"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceFilterPickerProps } from "@/types/commandWorkspace/model";

export function CommandWorkspaceFilterPicker({
  filters,
  onChoose,
  selectedIndex,
}: CommandWorkspaceFilterPickerProps) {
  return (
    <div className="absolute inset-x-5 top-full z-10 overflow-hidden rounded-xl border border-border bg-surface-overlay/95 py-1 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-content-muted">
        <AtSign className="size-3.5" />
        选择搜索分类
      </div>
      <ScrollArea style={{ height: filters.length * 36, maxHeight: "50vh" }}>
        {filters.map((candidate, index) => (
          <button
            key={candidate.id}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChoose(candidate)}
            className={cn(
              "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
              selectedIndex === index
                ? "bg-content/12 text-content"
                : "text-content-muted hover:bg-content/8",
            )}
          >
            <span>{candidate.label}</span>
            <kbd className="text-xs text-content-muted">{candidate.token}</kbd>
          </button>
        ))}
      </ScrollArea>
    </div>
  );
}
