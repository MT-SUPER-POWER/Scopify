"use client";

import { useCacheManagement } from "@/hooks/cache/useCacheManagement";
import { CacheCleanupPage } from "./CacheCleanupPage";

export function CacheCleanupSettingsScreen() {
  const cacheManagement = useCacheManagement();
  return (
    <CacheCleanupPage
      error={cacheManagement.error}
      isClearing={cacheManagement.isClearing}
      isLoading={cacheManagement.isLoading}
      onClear={cacheManagement.clear}
      onRefresh={cacheManagement.refresh}
      onToggleCategory={cacheManagement.toggleCategory}
      onToggleScope={cacheManagement.toggleScope}
      selectedCategories={cacheManagement.selectedCategories}
      selection={cacheManagement.selection}
      stats={cacheManagement.stats}
    />
  );
}
