"use client";

import { Clock3, CornerDownLeft, Search, Trash2 } from "lucide-react";
import type { CommandWorkspaceSearchSuggestion } from "@/types/commandWorkspace";

interface CommandWorkspaceDirectSearchResultsProps {
  isLoading: boolean;
  onClearRecent(): void;
  onRemoveRecent(item: string): void;
  onSubmit(candidate: string): void;
  query: string;
  recent: string[];
  selectedIndex: number;
  suggestions: CommandWorkspaceSearchSuggestion[];
}

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
    <div className="max-h-[52vh] overflow-y-auto py-2">
      {!query && recent.length > 0 ? (
        <section>
          <div className="flex items-center justify-between px-5 py-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
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
            <div
              key={item}
              className={
                selectedIndex === index
                  ? "group flex items-center gap-3 bg-white/10 px-5 py-2.5"
                  : "group flex items-center gap-3 px-5 py-2.5 hover:bg-white/6"
              }
            >
              <Clock3 className="size-4 text-zinc-500" />
              <button
                type="button"
                onClick={() => onSubmit(item)}
                className="min-w-0 flex-1 truncate text-left text-sm text-zinc-200"
              >
                {item}
              </button>
              <button
                type="button"
                onClick={() => onRemoveRecent(item)}
                className="rounded p-1 text-zinc-600 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white"
                aria-label={`移除 ${item}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </section>
      ) : null}
      {query && isLoading ? (
        <p className="px-5 py-6 text-center text-sm text-zinc-400">正在查找建议…</p>
      ) : null}
      {query && !isLoading && suggestions.length > 0 ? (
        <section>
          <p className="px-5 py-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            搜索建议
          </p>
          {suggestions.map((item, index) => (
            <button
              key={item.keyword}
              type="button"
              onClick={() => onSubmit(item.keyword)}
              className={
                selectedIndex === index
                  ? "flex w-full items-center gap-3 bg-white/10 px-5 py-2.5 text-left text-sm text-zinc-200"
                  : "flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/6"
              }
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
          className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm text-zinc-300 hover:bg-white/6"
        >
          <CornerDownLeft className="size-4 text-zinc-300" />
          搜索“{query}”
        </button>
      ) : null}
    </div>
  );
}
