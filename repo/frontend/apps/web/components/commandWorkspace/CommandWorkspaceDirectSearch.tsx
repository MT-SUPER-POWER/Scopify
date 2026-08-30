"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommandWorkspaceQueryInput } from "@/components/commandWorkspace/CommandWorkspaceQueryInput";
import { CommandWorkspaceDirectSearchResults } from "@/components/commandWorkspace/CommandWorkspaceDirectSearchResults";
import { useCommandWorkspaceSuggestions } from "@/hooks/commandWorkspace/useCommandWorkspaceSuggestions";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { buildSearchUrl } from "@/lib/search/searchCategory";
import { useSearchStore } from "@/store/module/search";
import type { CommandWorkspaceSearchFilter } from "@/types/commandWorkspace";
import type { SearchRecentEntry } from "@/types/search";

interface CommandWorkspaceDirectSearchProps {
  initialQuery: string;
  onClose(): void;
  onEnterCommand(): void;
}

export function CommandWorkspaceDirectSearch({
  initialQuery,
  onClose,
  onEnterCommand,
}: CommandWorkspaceDirectSearchProps) {
  const router = useSmartRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const addRecent = useSearchStore((state) => state.addRecent);
  const clearRecent = useSearchStore((state) => state.clearRecent);
  const placeholder = useSearchStore((state) => state.placeholder);
  const recent = useSearchStore((state) => state.recent);
  const removeRecent = useSearchStore((state) => state.removeRecent);
  const setGlobalQuery = useSearchStore((state) => state.setQuery);
  const [filter, setFilter] = useState<CommandWorkspaceSearchFilter | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { isLoading, suggestions } = useCommandWorkspaceSuggestions(query);
  const candidates = query ? suggestions.map((item) => item.keyword) : recent.slice(0, 8);

  useEffect(() => {
    const focusTimeout = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(focusTimeout);
  }, []);

  const submit = useCallback(
    (candidate: SearchRecentEntry | string) => {
      const entry: SearchRecentEntry =
        typeof candidate === "string"
          ? { category: filter?.category ?? "All", keyword: candidate }
          : candidate;
      const keyword = entry.keyword.trim();
      if (!keyword) return;
      if (keyword.startsWith(">")) {
        onEnterCommand();
        return;
      }
      setGlobalQuery(keyword);
      addRecent({ ...entry, keyword });
      router.replace(buildSearchUrl(keyword, entry.category));
      onClose();
    },
    [addRecent, filter, onClose, onEnterCommand, router, setGlobalQuery],
  );

  const handleQueryChange = (nextQuery: string) => {
    if (nextQuery.trimStart().startsWith(">")) {
      onEnterCommand();
      return;
    }
    setQuery(nextQuery);
    setSelectedIndex(0);
  };

  return (
    <>
      <CommandWorkspaceQueryInput
        autoFocus
        filter={filter}
        inputRef={inputRef}
        onFilterChange={setFilter}
        onQueryChange={handleQueryChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit(candidates[selectedIndex] ?? query);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((index) => (candidates.length ? (index + 1) % candidates.length : 0));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((index) =>
              candidates.length ? (index - 1 + candidates.length) % candidates.length : 0,
            );
          }
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
        placeholder={placeholder}
        query={query}
      />
      <div className="mx-5 h-px bg-white/8" />
      <CommandWorkspaceDirectSearchResults
        isLoading={isLoading}
        onClearRecent={clearRecent}
        onRemoveRecent={removeRecent}
        onSubmit={submit}
        query={query}
        recent={recent}
        selectedIndex={selectedIndex}
        suggestions={suggestions}
      />
      <footer className="flex items-center gap-2 border-t border-white/10 bg-black/20 px-5 py-3 text-xs text-zinc-400">
        <kbd className="rounded border border-white/15 bg-white/8 px-1.5 py-0.5 text-zinc-200">
          @
        </kbd>
        选择分类
        <span className="ml-auto">Enter 查看完整结果</span>
      </footer>
    </>
  );
}
