"use client";

import { LoaderCircle } from "lucide-react";
import { MvCard } from "@/components/mv/MvCard";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { useI18n } from "@/store/module/i18n";
import type { MvsViewProps } from "@/types/components/search";
import { SearchCategoryHeader } from "./SearchCategoryHeader";

/** 搜索结果的 MV 分类：16:9 卡片网格，滚动到底自动加载下一页。 */
export function MvsView({ hasNextPage, isFetchingNextPage, onLoadMore, mvs }: MvsViewProps) {
  const { t } = useI18n();
  const loadMoreRef = useInfiniteScrollTrigger({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: onLoadMore,
  });

  return (
    <div className="pb-10">
      <SearchCategoryHeader category="MVs" />
      {mvs.length > 0 ? (
        <div className="grid w-full min-w-0 grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {mvs.map((mv) => (
            <MvCard key={mv.id} mv={mv} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-content-subtle">
          {t("search.section.noMvResults")}
        </p>
      )}
      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {isFetchingNextPage ? (
        <div className="flex justify-center py-6 text-content-muted" aria-live="polite">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
