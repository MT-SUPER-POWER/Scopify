"use client";

import { AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceFilterPickerProps } from "@/types/commandWorkspace";

export function CommandWorkspaceFilterPicker({
  filters,
  onChoose,
  selectedIndex,
}: CommandWorkspaceFilterPickerProps) {
  return (
    <div className="absolute inset-x-5 top-full z-10 overflow-hidden rounded-xl border border-white/12 bg-zinc-950/95 py-1 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400">
        <AtSign className="size-3.5" />
        选择搜索分类
      </div>
      {filters.map((candidate, index) => (
        <button
          key={candidate.id}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChoose(candidate)}
          className={cn(
            "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
            selectedIndex === index ? "bg-white/12 text-white" : "text-zinc-300 hover:bg-white/8",
          )}
        >
          <span>{candidate.label}</span>
          <kbd className="text-xs text-zinc-500">{candidate.token}</kbd>
        </button>
      ))}
    </div>
  );
}
