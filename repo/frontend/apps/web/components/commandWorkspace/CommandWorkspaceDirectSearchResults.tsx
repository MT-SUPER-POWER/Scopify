"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { CommandWorkspaceRecentSearchRow } from "@/components/commandWorkspace/CommandWorkspaceRecentSearchRow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceDirectSearchResultsProps } from "@/types/commandWorkspace";

export function CommandWorkspaceDirectSearchResults({
  isLoading,
  onClearRecent,
  onRemoveRecent,
  onSubmit,
  query,
  recent,
  selectedIndex,
  suggestions,
}: CommandWorkspaceDirectSearchResultsProps) {
  return (
    <ScrollArea className="h-[min(52vh,32rem)]">
      <div className="space-y-2 px-2.5 py-2">
        {!query && recent.length > 0 ? (
          <section className="space-y-0.5">
            <div className="flex items-center justify-between px-3.5 py-1.5 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              最近搜索
              <button
                type="button"
                onClick={onClearRecent}
                className="text-xs font-medium tracking-normal text-zinc-500 hover:text-white"
              >
                清空
              </button>
            </div>
            {recent.slice(0, 8).map((item, index) => (
              <CommandWorkspaceRecentSearchRow
                key={`${item.category}-${item.keyword}`}
                item={item}
                onRemove={onRemoveRecent}
                onSubmit={onSubmit}
                selected={selectedIndex === index}
              />
            ))}
          </section>
        ) : null}
        {query && isLoading ? (
          <p className="px-5 py-6 text-center text-sm text-zinc-400">正在查找建议…</p>
        ) : null}
        {query && !isLoading && suggestions.length > 0 ? (
          <section className="space-y-0.5">
            <p className="px-3.5 py-1.5 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              搜索建议
            </p>
            {suggestions.map((item, index) => (
              <button
                key={item.keyword}
                type="button"
                onClick={() => onSubmit(item.keyword)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3.5 py-2 text-left text-sm text-zinc-200 transition-colors",
                  selectedIndex === index ? "bg-white/10" : "hover:bg-white/6",
                )}
              >
                <Search className="size-4 shrink-0 text-zinc-500" />
                <span className="truncate">{item.keyword}</span>
              </button>
            ))}
          </section>
        ) : null}
        {query && !isLoading && suggestions.length === 0 ? (
          <button
            type="button"
            onClick={() => onSubmit(query)}
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-white/6"
          >
            <CornerDownLeft className="size-4 text-zinc-300" />
            搜索“{query}”
          </button>
        ) : null}
      </div>
    </ScrollArea>
  );
}
