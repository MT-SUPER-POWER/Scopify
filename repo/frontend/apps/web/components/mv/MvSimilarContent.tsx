"use client";

import { useCallback, useEffect, useMemo } from "react";
import { LoaderCircle } from "lucide-react";
import { MvListItem } from "@/components/mv/MvListItem";
import { MvSimilarSkeleton } from "@/components/mv/MvSkeletons";
import { QueryFailure } from "@/components/shared/QueryFailure";
import { QueryPending } from "@/components/shared/QueryPending";
import { useInfiniteMvSearchQuery } from "@/hooks/search/useSearchQueries";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { getRelatedMvKeyword, getRelatedMvs } from "@/lib/music/relatedMvs";
import { useI18n } from "@/store/module/i18n";
import type { MvSimilarContentProps } from "@/types/components/mv";

export function MvSimilarContent({ mvid, detail, onNextChange }: MvSimilarContentProps) {
  const { t } = useI18n();
  const keyword = getRelatedMvKeyword(detail);
  const query = useInfiniteMvSearchQuery(keyword, 20, true, true);
  const mvs = useMemo(
    () => getRelatedMvs(query.data?.pages.flatMap((page) => page.result?.mvs ?? []) ?? [], mvid),
    [query.data, mvid],
  );
  const { fetchNextPage } = query;
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);
  const loadMoreRef = useInfiniteScrollTrigger({
    enabled: Boolean(query.hasNextPage) && !query.isFetching && !query.isFetchNextPageError,
    onIntersect: loadMore,
  });
  const nextId = mvs[0]?.id ?? null;
  useEffect(() => {
    onNextChange(nextId);
    return () => onNextChange(null);
  }, [nextId, onNextChange]);
  if (query.isPending)
    return query.fetchStatus === "paused" ? <QueryPending isPaused /> : <MvSimilarSkeleton />;
  if (!mvs.length && !query.hasNextPage) return null;
  return (
    <>
      <h2 className="mb-2 text-base font-bold">{t("mv.section.similar")}</h2>
      <ul className="-mx-1 flex flex-col gap-1">
        {mvs.map((item) => (
          <li key={item.id}>
            <MvListItem mv={item} href={`/mv?id=${item.id}`} size="md" />
          </li>
        ))}
      </ul>
      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {query.isFetchingNextPage ? (
        <div
          role="status"
          aria-label={t("common.status.loading")}
          className="flex justify-center py-4 text-content-muted"
        >
          <LoaderCircle aria-hidden className="size-5 animate-spin" />
        </div>
      ) : null}
      {query.isFetchNextPageError && query.error ? (
        <QueryFailure error={query.error} onRetry={loadMore} compact />
      ) : null}
    </>
  );
}
