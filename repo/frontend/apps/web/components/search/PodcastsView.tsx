"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { PodcastViewToggle } from "@/components/library/PodcastViewToggle";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { useI18n } from "@/store/module/i18n";
import type { PodcastsViewProps } from "@/types/components/search";
import type { PodcastViewMode } from "@/types/library";
import { PodcastCard } from "./PodcastCard";
import { PodcastRow } from "./PodcastRow";
import { SearchCategoryHeader } from "./SearchCategoryHeader";

export function PodcastsView({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  podcasts,
}: PodcastsViewProps) {
  const { t } = useI18n();
  const [view, setView] = useState<PodcastViewMode>("cards");
  const loadMoreRef = useInfiniteScrollTrigger({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: onLoadMore,
  });

  return (
    <div className="pb-10">
      <SearchCategoryHeader
        category="Podcasts"
        actions={<PodcastViewToggle value={view} onChange={setView} />}
      />
      {podcasts.length > 0 ? (
        view === "list" ? (
          <Table
            containerClassName="overflow-x-auto"
            className="w-full table-fixed text-content-muted"
          >
            <TableHeader className="border-b border-content/5">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-12 text-center text-content-muted">#</TableHead>
                <TableHead className="text-content-muted">
                  {t("search.category.podcasts")}
                </TableHead>
                <TableHead className="hidden w-32 text-content-muted md:table-cell">
                  {t("search.podcast.tags")}
                </TableHead>
                <TableHead className="hidden w-20 text-right text-content-muted md:table-cell">
                  {t("search.podcast.rating")}
                </TableHead>
                <TableHead className="hidden w-28 text-right text-content-muted sm:table-cell">
                  {t("search.podcast.subscribers")}
                </TableHead>
                <TableHead className="hidden w-24 text-right text-content-muted sm:table-cell">
                  {t("search.podcast.episodes")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podcasts.map((podcast, index) => (
                <PodcastRow key={podcast.id} index={index} podcast={podcast} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-4 sm:gap-5">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        )
      ) : (
        <p className="py-8 text-center text-sm text-content-subtle">
          {t("search.section.noPodcastResults")}
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
