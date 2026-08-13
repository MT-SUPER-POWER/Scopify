"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CACHE_SCOPE_CATEGORIES, getCacheSelectionKey } from "@/constants/cache";
import { formatCacheSize } from "@/lib/cache/presentation";
import { getCacheScopeSelectionState } from "@/lib/cache/cacheSelection";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { CacheCategory } from "@/types/cache";
import type { CacheCleanupPageProps } from "@/types/components/cache";
import { CacheCheckbox } from "./CacheCheckbox";
import { CacheCleanupConfirmDialog } from "./CacheCleanupConfirmDialog";

const IRRECOVERABLE_LYRIC_CATEGORIES: readonly CacheCategory[] = [
  "lyric-match",
  "imported-lyric",
  "lyric-source",
];

export function CacheCleanupPage({
  error,
  isClearing,
  isLoading,
  onClear,
  onRefresh,
  onToggleCategory,
  onToggleScope,
  selectedCategories,
  selection,
  stats,
}: CacheCleanupPageProps) {
  const { t } = useI18n();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const containsLyricData = useMemo(
    () =>
      IRRECOVERABLE_LYRIC_CATEGORIES.some((category) =>
        selectedCategories.has(getCacheSelectionKey("playback", category)),
      ),
    [selectedCategories],
  );

  const confirmClear = async () => {
    const result = await onClear();
    setIsConfirmOpen(false);
    if (!result) return;
    if (result.failedCategories.length > 0) {
      toast.error(t("settings.cache.cleanup.partialFailure"));
      return;
    }
    toast.success(
      t("settings.cache.cleanup.success", {
        count: result.entryCount,
        size: formatCacheSize(result.sizeBytes),
      }),
    );
  };

  return (
    <div className="text-muted-foreground relative flex w-full flex-col p-6 md:p-10">
      <div className="max-w-4xl">
        {/* 头部：去除冗余的局部返回按钮，将刷新按钮约束在 max-w-4xl 内容容器右侧 */}
        <div className="mt-4 mb-8 flex items-center justify-between gap-4">
          <h1 className="text-foreground text-3xl font-black tracking-tight md:text-4xl">
            {t("settings.cache.cleanup.title")}
          </h1>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || isClearing}
            onClick={() => void onRefresh()}
            className="shrink-0"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            {t("settings.cache.cleanup.refresh")}
          </Button>
        </div>

        {error ? <p className="text-destructive mb-6 text-sm">{error}</p> : null}

        <div className="space-y-8 pb-32">
          {(["page", "playback"] as const).map((scope) => {
            const scopeStats = stats?.[scope];
            const selectionState = getCacheScopeSelectionState(scope, selectedCategories);
            const categories = CACHE_SCOPE_CATEGORIES[scope];
            const selectedScopeSummary = scopeStats?.categories
              .filter((category) =>
                selectedCategories.has(getCacheSelectionKey(scope, category.category)),
              )
              .reduce(
                (summary, category) => ({
                  entryCount: summary.entryCount + category.entryCount,
                  sizeBytes: summary.sizeBytes + category.sizeBytes,
                }),
                { entryCount: 0, sizeBytes: 0 },
              ) ?? { entryCount: 0, sizeBytes: 0 };

            return (
              <section key={scope} className="border-border border-b pb-6 last:border-b-0">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <CacheCheckbox
                    checked={selectionState.checked}
                    indeterminate={selectionState.indeterminate}
                    disabled={isLoading || isClearing}
                    label={t(`settings.cache.scope.${scope}.title`)}
                    onCheckedChange={(checked) => onToggleScope(scope, checked)}
                  />
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {t("settings.cache.cleanup.scopeSummary", {
                      count: scopeStats?.entryCount ?? 0,
                      size: formatCacheSize(scopeStats?.sizeBytes ?? 0),
                      selectedSize: formatCacheSize(selectedScopeSummary.sizeBytes),
                    })}
                  </p>
                </div>
                <div className="divide-border/65 ml-7 divide-y">
                  {categories.map((category) => {
                    const categoryStats = scopeStats?.categories.find(
                      (entry) => entry.category === category,
                    );
                    return (
                      <div
                        key={category}
                        className="flex min-h-12 items-center justify-between gap-4 py-3"
                      >
                        <CacheCheckbox
                          checked={selectedCategories.has(getCacheSelectionKey(scope, category))}
                          disabled={isLoading || isClearing || !categoryStats?.entryCount}
                          label={t(`settings.cache.category.${category}`)}
                          onCheckedChange={(checked) => onToggleCategory(scope, category, checked)}
                        />
                        <p className="text-muted-foreground shrink-0 text-right text-sm tabular-nums">
                          {t("settings.cache.cleanup.categorySummary", {
                            count: categoryStats?.entryCount ?? 0,
                            size: formatCacheSize(categoryStats?.sizeBytes ?? 0),
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* 底部悬浮浮层：重构为独立精美的悬浮卡片 (Floating Action Bar)，悬浮在底栏播放条上方 */}
      <div
        className={cn(
          "fixed bottom-28 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4 transition-all duration-300",
          selection.entryCount > 0
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0",
        )}
      >
        <div className="bg-surface-overlay/95 border-border/80 shadow-floating flex items-center justify-between gap-4 rounded-full border px-6 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="bg-destructive/15 text-destructive flex size-7 items-center justify-center rounded-full">
              <Trash2 className="size-3.5" />
            </span>
            <p className="text-foreground text-sm font-medium">
              {t("settings.cache.cleanup.selection", {
                count: selection.entryCount,
                size: formatCacheSize(selection.sizeBytes),
              })}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full px-6 py-2 text-sm font-bold transition-all hover:scale-105 active:scale-100"
            disabled={isLoading || isClearing || selection.entryCount === 0}
            onClick={() => setIsConfirmOpen(true)}
          >
            {t("settings.cache.cleanup.action")}
          </Button>
        </div>
      </div>

      <CacheCleanupConfirmDialog
        open={isConfirmOpen}
        isClearing={isClearing}
        selection={selection}
        containsLyricData={containsLyricData}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => void confirmClear()}
      />
    </div>
  );
}
