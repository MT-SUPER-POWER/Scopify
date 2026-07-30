"use client";

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { GridCard } from "@/components/home/GridCard";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { usePodcastPlay } from "@/hooks/library/usePodcastPlay";
import type { PodcastRecommendationsProps } from "@/types/components/library";

const RECOMMENDATIONS_PER_PAGE = 5;

function RecommendationSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {[0, 1, 2, 3, 4].map((index) => (
        <div key={index} className="animate-pulse space-y-2">
          <div className="aspect-square rounded-md bg-white/5" />
          <div className="h-4 w-4/5 rounded-sm bg-white/5" />
          <div className="h-3 w-1/2 rounded-sm bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function getPodcastSubtitle(category?: string, hostName?: string) {
  return [category, hostName].filter(Boolean).join(" · ") || undefined;
}

export function PodcastRecommendations({
  isError,
  isLoading,
  isRefreshing,
  onRefresh,
  podcasts,
}: PodcastRecommendationsProps) {
  const { t } = useI18n();
  const router = useSmartRouter();
  const { handlePlayPodcast, loadingPodcastId } = usePodcastPlay();
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(podcasts.length / RECOMMENDATIONS_PER_PAGE);
  const visiblePodcasts = podcasts.slice(
    page * RECOMMENDATIONS_PER_PAGE,
    (page + 1) * RECOMMENDATIONS_PER_PAGE,
  );

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, Math.max(pageCount - 1, 0)));
  }, [pageCount]);

  if (!isLoading && !isError && podcasts.length === 0) return null;

  const handleRefresh = () => {
    setPage(0);
    onRefresh();
  };

  return (
    <section className="mt-14" aria-labelledby="podcast-recommendations-heading">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="podcast-recommendations-heading" className="text-2xl font-bold text-white">
          {t("library.podcasts.recommendations")}
        </h2>
        <button
          type="button"
          title={t("library.podcasts.refreshRecommendations")}
          aria-label={t("library.podcasts.refreshRecommendations")}
          disabled={isRefreshing}
          onClick={handleRefresh}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
        </button>
      </div>
      {isLoading ? (
        <>
          <RecommendationSkeleton />
        </>
      ) : isError ? (
        <NetworkRetryState
          compact
          title={t("network.offline.title")}
          subtitle={t("network.offline.subtitle")}
          actionLabel={t("network.action.refresh")}
          isRetrying={isRefreshing}
          onRetry={handleRefresh}
        />
      ) : (
        <div className="group/podcast-carousel relative">
          <div className="grid grid-cols-3 gap-6 md:grid-cols-4 lg:grid-cols-5">
            {visiblePodcasts.map((podcast) => (
              <GridCard
                key={podcast.id}
                id={podcast.id}
                name={podcast.name}
                coverUrl={podcast.picUrl ?? podcast.coverUrl}
                onClick={() => router.push(`/radio?id=${podcast.id}`)}
                onPlay={(e) => handlePlayPodcast(podcast.id, e)}
                isLoading={loadingPodcastId === podcast.id}
                playCount={podcast.playCount}
                subtitle={getPodcastSubtitle(podcast.category, podcast.dj?.nickname)}
              />
            ))}
          </div>
          {pageCount > 1 ? (
            <>
              <button
                type="button"
                title={t("library.podcasts.previousRecommendations")}
                aria-label={t("library.podcasts.previousRecommendations")}
                disabled={page === 0}
                onClick={() => setPage((currentPage) => currentPage - 1)}
                className="pointer-events-none absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white opacity-0 transition-opacity group-hover/podcast-carousel:pointer-events-auto group-hover/podcast-carousel:opacity-100 hover:bg-black/70 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-0"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                title={t("library.podcasts.nextRecommendations")}
                aria-label={t("library.podcasts.nextRecommendations")}
                disabled={page === pageCount - 1}
                onClick={() => setPage((currentPage) => currentPage + 1)}
                className="pointer-events-none absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white opacity-0 transition-opacity group-hover/podcast-carousel:pointer-events-auto group-hover/podcast-carousel:opacity-100 hover:bg-black/70 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-0"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}
