import { CACHE_SCOPE_CATEGORIES, getCacheSelectionKey } from "@/constants/cache";
import type { CacheScope, CacheSelectionKey, CacheStats } from "@/types/cache";

export function getCacheSelectionSummary(
  stats: CacheStats | null,
  selectedCategories: ReadonlySet<CacheSelectionKey>,
) {
  if (!stats) return { entryCount: 0, sizeBytes: 0 };

  return [stats.page, stats.playback]
    .flatMap((scope) => scope.categories.map((category) => ({ category, scope: scope.scope })))
    .filter(({ category, scope }) =>
      selectedCategories.has(getCacheSelectionKey(scope, category.category)),
    )
    .reduce(
      (summary, { category }) => ({
        entryCount: summary.entryCount + category.entryCount,
        sizeBytes: summary.sizeBytes + category.sizeBytes,
      }),
      { entryCount: 0, sizeBytes: 0 },
    );
}

export function getCacheScopeSelectionState(
  scope: CacheScope,
  selectedCategories: ReadonlySet<CacheSelectionKey>,
) {
  const categories = CACHE_SCOPE_CATEGORIES[scope];
  const selectedCount = categories.filter((category) =>
    selectedCategories.has(getCacheSelectionKey(scope, category)),
  ).length;

  return {
    checked: selectedCount === categories.length,
    indeterminate: selectedCount > 0 && selectedCount < categories.length,
  };
}
