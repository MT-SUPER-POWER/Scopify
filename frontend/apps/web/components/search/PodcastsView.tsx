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
            className="text-content-muted w-full table-fixed"
          >
            <TableHeader className="border-content/5 border-b">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-content-muted w-12 text-center">#</TableHead>
                <TableHead className="text-content-muted">
                  {t("search.category.podcasts")}
                </TableHead>
                <TableHead className="text-content-muted hidden w-32 md:table-cell">
                  {t("search.podcast.tags")}
                </TableHead>
                <TableHead className="text-content-muted hidden w-20 text-right md:table-cell">
                  {t("search.podcast.rating")}
                </TableHead>
                <TableHead className="text-content-muted hidden w-28 text-right sm:table-cell">
                  {t("search.podcast.subscribers")}
                </TableHead>
                <TableHead className="text-content-muted hidden w-24 text-right sm:table-cell">
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
        <p className="text-content-subtle py-8 text-center text-sm">
          {t("search.section.noPodcastResults")}
        </p>
      )}
      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {isFetchingNextPage ? (
        <div className="text-content-muted flex justify-center py-6" aria-live="polite">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
