"use client";

import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import {
  BannerItemSkeleton,
  GridCardSkeleton,
  SongItemSkeleton,
  ToplistCardSkeleton,
} from "@/components/home/HomePageSkeleton";
import { QueryPending } from "@/components/shared/QueryPending";
import { useIsOnline } from "@/hooks/core/useIsOnline";
import { useI18n } from "@/store/module/i18n";
import type { HomeSectionPendingProps } from "@/types/home/components";

export function HomeSectionPending({ isPaused, kind, title, titleKey }: HomeSectionPendingProps) {
  const { t } = useI18n();
  const isOnline = useIsOnline();
  if (isPaused ?? !isOnline) return <QueryPending isPaused />;

  return (
    <section aria-busy="true" className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">
        {title ?? (titleKey ? t(titleKey) : t("home.madeFor", { name: t("home.you") }))}
      </h2>
      {kind === "greeting" ? (
        <div
          aria-hidden
          className="grid max-h-35 w-full min-w-0 auto-rows-[64px] grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 overflow-hidden"
        >
          {Array.from({ length: 10 }, (_, index) => (
            <BannerItemSkeleton key={index} />
          ))}
        </div>
      ) : kind === "grid" || kind === "artist" ? (
        <div
          aria-hidden
          className="grid w-full min-w-0 auto-rows-0 grid-cols-[repeat(auto-fill,minmax(min(100%,176px),1fr))] grid-rows-[auto] gap-x-2 overflow-hidden"
        >
          {Array.from({ length: 10 }, (_, index) => (
            <GridCardSkeleton key={index} isArtist={kind === "artist"} />
          ))}
        </div>
      ) : kind === "songs" ? (
        <div aria-hidden className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <SongItemSkeleton key={index} />
          ))}
        </div>
      ) : kind === "voices" ? (
        <div aria-hidden className="grid w-full grid-cols-1 gap-x-12 gap-y-5 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-16 shrink-0 rounded bg-skeleton" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3 bg-skeleton" />
                <Skeleton className="h-3 w-1/2 bg-skeleton-subtle" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div aria-hidden className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <ToplistCardSkeleton key={index} />
          ))}
        </div>
      )}
    </section>
  );
}
