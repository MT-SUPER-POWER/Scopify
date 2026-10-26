"use client";

import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { useCommandWorkspaceSuggestions } from "@/hooks/commandWorkspace/useCommandWorkspaceSuggestions";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { resolveCommandWorkspaceSearchEntry } from "@/lib/commandWorkspace/search";
import { buildSearchUrl } from "@/lib/search/searchCategory";
import { useSearchStore } from "@/store/module/search";
import type {
  CommandWorkspaceDirectSearchProps,
  CommandWorkspaceSearchFilter,
} from "@/types/commandWorkspace";
import type { SearchRecentEntry } from "@/types/search";

export function useCommandWorkspaceDirectSearch({
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { isLoading, suggestions } = useCommandWorkspaceSuggestions(query);
  const candidates = query.trim()
    ? suggestions.length
      ? suggestions.map((item) => item.keyword)
      : [query]
    : recent.slice(0, 8);
  const candidateCount = candidates.length;

  useEffect(() => {
    const focusTimeout = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(focusTimeout);
  }, []);

  const submit = useCallback(
    (candidate: SearchRecentEntry | string) => {
      const entry = resolveCommandWorkspaceSearchEntry(candidate, filter);
      const keyword = entry.keyword.trim() || placeholder.trim();
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
    [addRecent, filter, onClose, onEnterCommand, placeholder, router, setGlobalQuery],
  );

  const handleQueryChange = (nextQuery: string) => {
    if (nextQuery.trimStart().startsWith(">")) {
      onEnterCommand();
      return;
    }
    setQuery(nextQuery);
    setGlobalQuery(nextQuery);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      submit(candidates[selectedIndex] ?? query);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (candidateCount ? (index + 1) % candidateCount : -1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) =>
        candidateCount ? (index <= 0 ? candidateCount - 1 : index - 1) : -1,
      );
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };
  return {
    filter,
    inputRef,
    isLoading,
    placeholder,
    query,
    recent,
    selectedIndex,
    suggestions,
    submit,
    clearRecent,
    removeRecent,
    handleKeyDown,
    handleQueryChange,
    onFilterChange: (next: CommandWorkspaceSearchFilter | null) => {
      setFilter(next);
      setSelectedIndex(-1);
    },
  };
}
