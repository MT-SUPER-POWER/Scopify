"use client";

import { Check, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { CommandWorkspaceIcon } from "@/components/commandWorkspace/CommandWorkspaceIcon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
import { cn } from "@/lib/utils";
import type {
  CommandWorkspaceHighlightProps,
  CommandWorkspaceRootListProps,
} from "@/types/commandWorkspace/model";

export function CommandWorkspaceRootList({
  items,
  onSelect,
  selectedIndex,
}: CommandWorkspaceRootListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedId = items[selectedIndex]?.id;

  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <ScrollArea className="h-[min(52vh,32rem)]">
      <div ref={listRef} className="space-y-0.5 px-2.5 py-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.active}
            data-selected={selectedIndex === index}
            onClick={() => onSelect(item, index)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left transition-colors",
              selectedIndex === index ? "bg-content/10" : "hover:bg-content/6",
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-content/8 text-content-muted">
              <CommandWorkspaceIcon id={item.id} />
            </span>
            {item.active ? <Check aria-label="当前选择" className="size-4 shrink-0" /> : null}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-content">
                <HighlightedLabel text={item.label} ranges={item.labelRanges} />
              </span>
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

/** 高亮命中的字符，让用户看出这条为什么排在这里（拼音、跳字匹配也能对应到原文）。 */
function HighlightedLabel({ ranges, text }: CommandWorkspaceHighlightProps) {
  if (!ranges?.length) return text;
  const parts = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={start} className="bg-transparent font-semibold text-brand">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
