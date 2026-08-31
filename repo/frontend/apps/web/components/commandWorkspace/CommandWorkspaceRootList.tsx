"use client";

import { CommandWorkspaceIcon } from "@/components/commandWorkspace/CommandWorkspaceIcon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceRootListProps } from "@/types/commandWorkspace";

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
              selectedIndex === index ? "bg-white/10" : "hover:bg-white/6",
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/8 text-zinc-300">
              <CommandWorkspaceIcon id={item.id} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{item.label}</span>
              <span className="block truncate text-xs text-zinc-500">{item.summary}</span>
            </span>
            {item.binding ? (
              <kbd className="rounded-md border border-white/15 bg-white/8 px-2 py-1 font-mono text-xs leading-none text-zinc-200 shadow-sm">
                {getShortcutBindingLabel(item.binding)}
              </kbd>
            ) : null}
          </button>
        ))}
        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">没有匹配的命令。</p>
        ) : null}
      </div>
    </ScrollArea>
  );
}
