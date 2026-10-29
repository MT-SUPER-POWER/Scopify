"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/ui/useDebouncedValue";
import { searchSuggest } from "@/lib/api/search";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import type { CommandWorkspaceSearchSuggestion } from "@/types/commandWorkspace/model";

/** 输入停顿多久（ms）后才去请求联想词。 */
const SUGGEST_DEBOUNCE_MS = 200;

/**
 * 命令面板的搜索联想。联想只是输入时的辅助：请求失败不抛给边界、也不伪造空结果，
 * 只是不给出联想，面板照常用输入的原文作为候选。
 */
export function useCommandWorkspaceSuggestions(query: string) {
  const keyword = query.trim();
  const debouncedKeyword = useDebouncedValue(keyword, SUGGEST_DEBOUNCE_MS);
  const suggestQuery = useQuery({
    queryKey: musicQueryKeys.search.suggest(debouncedKeyword),
    queryFn: async () =>
      getSuggestions((await searchSuggest(debouncedKeyword)).data?.data?.suggests),
    enabled: debouncedKeyword.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  if (!keyword) return { isLoading: false, suggestions: [] };
  return {
    // 还在防抖或正在请求当前词时都算加载中
    isLoading: keyword !== debouncedKeyword || suggestQuery.isFetching,
    suggestions: suggestQuery.data ?? [],
  };
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
