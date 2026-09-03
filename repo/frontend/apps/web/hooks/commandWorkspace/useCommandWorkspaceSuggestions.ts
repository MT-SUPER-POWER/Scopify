"use client";

import { useEffect, useState } from "react";
import { searchSuggest } from "@/lib/api/search";
import type { CommandWorkspaceSearchSuggestion } from "@/types/commandWorkspace";

export function useCommandWorkspaceSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<CommandWorkspaceSearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let isCurrentRequest = true;
    setIsLoading(true);
    const timeout = window.setTimeout(async () => {
      try {
        const response = await searchSuggest(keyword);
        if (isCurrentRequest) setSuggestions(getSuggestions(response.data?.data?.suggests));
      } catch {
        if (isCurrentRequest) setSuggestions([]);
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    }, 200);

    return () => {
      isCurrentRequest = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  return { isLoading, suggestions };
}

function getSuggestions(value: unknown): CommandWorkspaceSearchSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      !("keyword" in candidate) ||
      typeof candidate.keyword !== "string"
    ) {
      return [];
    }
    return [{ keyword: candidate.keyword }];
  });
}
