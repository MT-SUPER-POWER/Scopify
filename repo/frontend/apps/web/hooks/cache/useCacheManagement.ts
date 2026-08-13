"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CACHE_SCOPE_CATEGORIES,
  DEFAULT_CACHE_SELECTION_KEYS,
  getCacheSelectionKey,
} from "@/constants/cache";
import { clearCache, getCacheStats } from "@/lib/cache/cacheManagement";
import { getCacheSelectionSummary } from "@/lib/cache/cacheSelection";
import type {
  CacheCategory,
  CacheClearResult,
  CacheScope,
  CacheSelectionKey,
  CacheStats,
} from "@/types/cache";

export function useCacheManagement() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<CacheSelectionKey>>(
    () => new Set(DEFAULT_CACHE_SELECTION_KEYS),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStats(await getCacheStats());
    } catch (cause) {
      console.error("[Cache] failed to load cache statistics:", cause);
      setError(cause instanceof Error ? cause.message : "Unable to load cache statistics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleCategory = useCallback(
    (scope: CacheScope, category: CacheCategory, checked: boolean) => {
      setSelectedCategories((current) => {
        const next = new Set(current);
        const key = getCacheSelectionKey(scope, category);
        if (checked) next.add(key);
        else next.delete(key);
        return next;
      });
    },
    [],
  );

  const toggleScope = useCallback((scope: CacheScope, checked: boolean) => {
    setSelectedCategories((current) => {
      const next = new Set(current);
      for (const category of CACHE_SCOPE_CATEGORIES[scope]) {
        const key = getCacheSelectionKey(scope, category);
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }, []);

  const selection = useMemo(
    () => getCacheSelectionSummary(stats, selectedCategories),
    [selectedCategories, stats],
  );

  const clear = useCallback(async (): Promise<CacheClearResult | null> => {
    if (isClearing || selectedCategories.size === 0) return null;

    const before = getCacheSelectionSummary(stats, selectedCategories);
    const selectedByScope = (Object.keys(CACHE_SCOPE_CATEGORIES) as CacheScope[]).map((scope) => ({
      scope,
      categories: CACHE_SCOPE_CATEGORIES[scope].filter((category) =>
        selectedCategories.has(getCacheSelectionKey(scope, category)),
      ),
    }));
    const failedCategories: CacheSelectionKey[] = [];

    setIsClearing(true);
    setError(null);
    try {
      await Promise.all(
        selectedByScope.map(async ({ scope, categories }) => {
          if (categories.length === 0) return;
          try {
            await clearCache({ scope, categories: [...categories] });
          } catch (cause) {
            console.error(`[Cache] failed to clear ${scope} cache:`, cause);
            failedCategories.push(
              ...categories.map((category) => getCacheSelectionKey(scope, category)),
            );
          }
        }),
      );
      await refresh();
      if (failedCategories.length > 0) {
        setSelectedCategories(new Set(failedCategories));
        setError("Some selected cache data could not be cleared.");
      }
      return { ...before, failedCategories };
    } finally {
      setIsClearing(false);
    }
  }, [isClearing, refresh, selectedCategories, stats]);

  return {
    clear,
    error,
    isClearing,
    isLoading,
    refresh,
    selectedCategories,
    selection,
    stats,
    toggleCategory,
    toggleScope,
  };
}
