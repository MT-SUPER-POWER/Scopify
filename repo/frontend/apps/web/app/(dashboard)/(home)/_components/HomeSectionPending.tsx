"use client";

import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import {
  HomeCardSkeletonGrid,
  HomeShortcutSkeletonGrid,
  SongItemSkeleton,
  ToplistCardSkeleton,
} from "@/components/home/HomePageSkeleton";
import { QueryConnectionWait } from "@/components/shared/QueryConnectionWait";
import { QueryPending } from "@/components/shared/QueryPending";
import { useIsOnline } from "@/hooks/core/useIsOnline";
import { useTranslation } from "react-i18next";

import type { HomeSectionPendingProps } from "@/types/home/components";

export function HomeSectionPending({
  isPaused,
  kind,
  title,
  titleKey,
  waitingForConnection = false,
}: HomeSectionPendingProps) {
  const { t } = useTranslation();
  const isOnline = useIsOnline();
  if (!waitingForConnection && (isPaused ?? !isOnline)) return <QueryPending isPaused />;

  const heading = title ?? (titleKey ? t(titleKey) : t("home.madeFor", { name: t("home.you") }));
  const skeleton = <HomeSectionSkeleton kind={kind} />;

  return (
    <section aria-busy className="space-y-4">
      {kind === "greeting" ? (
        <h1 className="text-2xl leading-tight font-bold tracking-tight text-content">{heading}</h1>
      ) : (
        <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">{heading}</h2>
      )}
      {waitingForConnection ? <QueryConnectionWait>{skeleton}</QueryConnectionWait> : skeleton}
    </section>
  );
}

function HomeSectionSkeleton({ kind }: Pick<HomeSectionPendingProps, "kind">) {
  if (kind === "greeting") return <HomeShortcutSkeletonGrid />;
  if (kind === "grid" || kind === "artist") {
    return <HomeCardSkeletonGrid isArtist={kind === "artist"} />;
  }
  if (kind === "songs") {
    return (
      <div aria-hidden className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <SongItemSkeleton key={index} />
        ))}
      </div>
    );
  }
  if (kind === "voices") {
    return (
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
    );
  }
  return (
    <div aria-hidden className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <ToplistCardSkeleton key={index} />
      ))}
    </div>
  );
}
