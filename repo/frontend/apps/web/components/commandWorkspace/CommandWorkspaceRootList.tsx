"use client";

import { ChevronRight } from "lucide-react";
import { CommandWorkspaceIcon } from "@/components/commandWorkspace/CommandWorkspaceIcon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceRootListProps } from "@/types/commandWorkspace/model";

export function CommandWorkspaceRootList({
  items,
  onSelect,
  selectedIndex,
}: CommandWorkspaceRootListProps) {
  return (
    <ScrollArea className="h-[min(52vh,32rem)]">
      <div className="space-y-0.5 px-2.5 py-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item, index)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left transition-colors",
              selectedIndex === index ? "bg-content/10" : "hover:bg-content/6",
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-content/8 text-content-muted">
              <CommandWorkspaceIcon id={item.id} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-content">{item.label}</span>
              <span className="block truncate text-xs text-content-muted">{item.summary}</span>
            </span>
            {item.type === "workspace" || item.foliaEntry?.action.kind === "group" ? (
              <ChevronRight className="size-4 text-content-muted" />
            ) : null}
            {item.binding ? (
              <kbd className="rounded-md border border-border bg-content/8 px-2 py-1 font-mono text-xs leading-none text-content shadow-sm">
                {getShortcutBindingLabel(item.binding)}
              </kbd>
            ) : null}
          </button>
        ))}
        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-content-muted">没有匹配的命令。</p>
        ) : null}
      </div>
    </ScrollArea>
  );
}
