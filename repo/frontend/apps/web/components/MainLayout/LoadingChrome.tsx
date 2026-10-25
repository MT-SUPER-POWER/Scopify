"use client";

import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { SidebarPlaylistSkeleton } from "@/components/Siderbar/SidebarPlaylistSkeleton";
import { ScopifyBrand } from "@/components/shared/ScopifyBrand";
import { useSidebarLoadingLayout } from "@/hooks/sidebar/useSidebarLoadingLayout";
import { cn } from "@/lib/utils";
import { headerStyles } from "@/styles";
import { NOW_PLAYING_PANEL_MAX_WIDTH, NOW_PLAYING_PANEL_MIN_WIDTH } from "@/constants/layout";

/** Mirrors components/Header: brand + history on the left, home + search centered, actions right. */
export function LoadingHeaderSkeleton() {
  return (
    <div
      className={cn(
        headerStyles.root,
        "grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 [-webkit-app-region:drag]",
      )}
    >
      <div className="flex items-center gap-2">
        <ScopifyBrand priority className="mx-2 min-w-0" wordmarkClassName={headerStyles.wordmark} />
        <Skeleton className="size-8 rounded-full bg-skeleton" />
        <Skeleton className="size-8 rounded-full bg-skeleton @max-[560px]:hidden" />
      </div>
      <div className="flex w-[min(36rem,44cqw)] items-center gap-2">
        <Skeleton className="size-11 shrink-0 rounded-full bg-skeleton" />
        <Skeleton className="h-11 flex-1 rounded-full bg-skeleton" />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="size-9 rounded-full bg-skeleton" />
        <Skeleton className="size-9 rounded-full bg-skeleton" />
        <Skeleton className="size-9 rounded-full bg-skeleton" />
      </div>
    </div>
  );
}

const NAV_SECTIONS = [
  ["w-12", "w-10"],
  ["w-16", "w-14", "w-16"],
];

/**
 * Mirrors components/Siderbar: same width source, nav rows (menu beside the first heading) and playlist rows.
 * `@max-[91px]/sidebar` matches useSidebarNarrow (<= 90px) on the same container.
 */
export function LoadingSidebarSkeleton() {
  const { hasSession, sizePercent } = useSidebarLoadingLayout();
  return (
    <div
      className="shrink-0 overflow-hidden rounded-lg bg-surface-sunken"
      style={{ width: `${sizePercent}%` }}
      aria-hidden
    >
      <aside className="@container/sidebar flex size-full min-h-0 flex-col bg-surface">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md bg-sidebar">
          <div className="min-h-0 flex-1 overflow-hidden">
            <nav className="flex flex-col gap-5 px-3 pt-3 pb-5 @max-[91px]/sidebar:gap-2 @max-[91px]/sidebar:px-2 @max-[91px]/sidebar:py-3">
              {NAV_SECTIONS.map((labels, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className="flex flex-col gap-1 @max-[91px]/sidebar:items-center"
                >
                  <div className="flex h-6 items-center justify-between pb-2 pl-2 @max-[91px]/sidebar:hidden">
                    <Skeleton className="h-3 w-10 bg-skeleton-subtle" />
                    {sectionIndex === 0 && (
                      <Skeleton className="-my-2 size-8 shrink-0 rounded-md bg-skeleton" />
                    )}
                  </div>
                  {labels.map((width, index) => (
                    <div
                      key={index}
                      className="flex h-10 items-center gap-3 px-3 @max-[91px]/sidebar:size-12 @max-[91px]/sidebar:justify-center @max-[91px]/sidebar:px-0"
                    >
                      <Skeleton className="size-5 shrink-0 rounded-md bg-skeleton" />
                      <Skeleton
                        className={`h-3.5 bg-skeleton ${width} @max-[91px]/sidebar:hidden`}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </nav>

            <section className="flex flex-col border-t border-content/10 @max-[91px]/sidebar:border-t-0">
              <div className="flex items-center justify-between pt-4 pr-3 pb-2 pl-5 @max-[91px]/sidebar:hidden">
                <Skeleton className="h-3 w-8 bg-skeleton-subtle" />
                <Skeleton className="-my-0.5 size-5 rounded-full bg-skeleton-subtle" />
              </div>
              {hasSession && (
                <div className="px-2 pb-4 @max-[91px]/sidebar:pb-2">
                  <SidebarPlaylistSkeleton />
                </div>
              )}
            </section>
          </div>

          <footer className="hidden h-14 shrink-0 items-center justify-center border-t border-content/5 px-2 @max-[91px]/sidebar:flex">
            <Skeleton className="size-8 rounded-md bg-skeleton" />
          </footer>
        </div>
      </aside>
    </div>
  );
}

/**
 * Mirrors components/nowPlaying: the full panel (cover, title, artist card) or the collapsed rail,
 * matching what the hydrated layout will render.
 */
export function LoadingNowPlayingSkeleton() {
  const { nowPlaying, nowPlayingSizePercent } = useSidebarLoadingLayout();
  if (nowPlaying === "rail") {
    return <div className="w-9 shrink-0 rounded-lg bg-surface-sunken" aria-hidden />;
  }
  if (nowPlaying !== "panel") return null;

  return (
    <div
      className="flex shrink-0 flex-col gap-4 overflow-hidden rounded-lg bg-surface-sunken px-4"
      style={{
        width: `${nowPlayingSizePercent}%`,
        minWidth: NOW_PLAYING_PANEL_MIN_WIDTH,
        maxWidth: NOW_PLAYING_PANEL_MAX_WIDTH,
      }}
      aria-hidden
    >
      <div className="flex h-14 shrink-0 items-center justify-between">
        <Skeleton className="h-4 w-20 bg-skeleton" />
        <Skeleton className="size-8 rounded-full bg-skeleton-subtle" />
      </div>
      <Skeleton className="aspect-square w-full shrink-0 rounded-lg bg-skeleton" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/5 bg-skeleton" />
        <Skeleton className="h-3.5 w-2/5 bg-skeleton-subtle" />
      </div>
      <Skeleton className="h-64 w-full shrink-0 rounded-lg bg-skeleton-subtle" />
    </div>
  );
}

export function LoadingPlayerBarSkeleton() {
  return (
    <footer className="flex h-17 items-center gap-4 rounded-lg bg-surface px-4 lg:h-18 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
        <Skeleton className="size-12 shrink-0 rounded-md bg-skeleton lg:size-14" />
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-3 w-28 bg-skeleton lg:w-40" />
          <Skeleton className="h-2.5 w-20 bg-skeleton-subtle lg:w-28" />
        </div>
      </div>

      <div className="hidden w-1/3 max-w-120 flex-col items-center gap-2 md:flex">
        <div className="flex items-center gap-4">
          <Skeleton className="size-4 rounded-full bg-skeleton" />
          <Skeleton className="size-5 rounded-full bg-skeleton" />
          <Skeleton className="size-9 rounded-full bg-skeleton" />
          <Skeleton className="size-5 rounded-full bg-skeleton" />
          <Skeleton className="size-4 rounded-full bg-skeleton" />
        </div>
        <Skeleton className="h-1 w-full rounded-full bg-skeleton" />
      </div>

      <div className="hidden flex-1 justify-end gap-3 lg:flex">
        <Skeleton className="size-5 rounded-md bg-skeleton" />
        <Skeleton className="size-5 rounded-md bg-skeleton" />
        <Skeleton className="h-1.5 w-20 self-center rounded-full bg-skeleton" />
      </div>
    </footer>
  );
}
