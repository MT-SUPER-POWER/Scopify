"use client";

import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { SidebarPlaylistSkeleton } from "@/components/Siderbar/SidebarPlaylistSkeleton";
import { ScopifyBrand } from "@/components/shared/ScopifyBrand";
import { useSidebarLoadingLayout } from "@/hooks/sidebar/useSidebarLoadingLayout";

export function LoadingHeaderSkeleton() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <Skeleton className="size-10 rounded-full bg-skeleton" />
        <Skeleton className="size-10 rounded-full bg-skeleton" />
      </div>
      <div className="flex flex-1 justify-center">
        <Skeleton className="h-10 w-full max-w-100 rounded-full bg-skeleton" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="hidden size-9 rounded-full bg-skeleton lg:block" />
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
 * Mirrors components/Siderbar: same width source, header, nav rows and playlist rows.
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
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-2 @max-[91px]/sidebar:justify-center @min-[208px]/sidebar:px-3 @min-[240px]/sidebar:px-4">
            <ScopifyBrand
              priority
              className="min-w-0"
              iconClassName="size-8 @max-[91px]/sidebar:size-9"
              wordmarkClassName="hidden @min-[208px]/sidebar:block"
            />
            <Skeleton className="size-8 shrink-0 rounded-md bg-skeleton @max-[91px]/sidebar:hidden" />
          </header>

          <div className="min-h-0 flex-1 overflow-hidden">
            <nav className="flex flex-col gap-5 px-3 pt-3 pb-5 @max-[91px]/sidebar:gap-2 @max-[91px]/sidebar:px-2 @max-[91px]/sidebar:py-3">
              {NAV_SECTIONS.map((labels, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className="flex flex-col gap-1 @max-[91px]/sidebar:items-center"
                >
                  <div className="flex h-6 items-start px-2 pt-0.5 @max-[91px]/sidebar:hidden">
                    <Skeleton className="h-3 w-10 bg-skeleton-subtle" />
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
