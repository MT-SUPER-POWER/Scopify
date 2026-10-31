"use client";

import type { ReactNode } from "react";
import {
  LoadingHeaderSkeleton,
  LoadingNowPlayingSkeleton,
  LoadingPlayerBarSkeleton,
  LoadingSidebarSkeleton,
} from "./LoadingChrome";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { cn } from "@/lib/utils";

/**
 * Silent loading shell shown while stores hydrate from localStorage, so the first paint never flashes
 * a logged-out UI. `content` is the current route's own placeholder, when it has one.
 */
export function DashboardSkeleton({ content }: { content?: ReactNode }) {
  return (
    <div
      className={cn(
        "relative flex h-dvh w-full flex-col bg-surface font-sans text-content",
        "gap-2 overflow-hidden p-2 select-none",
      )}
    >
      <LoadingHeaderSkeleton />
      <div className="flex min-h-0 flex-1 gap-2">
        <LoadingSidebarSkeleton />
        <section className="relative min-w-0 flex-1 overflow-hidden rounded-lg bg-surface-raised">
          {content ? (
            // Some desktop scroll enhancers annotate this scrollable shell before React hydrates.
            <div suppressHydrationWarning className="size-full overflow-hidden">
              {content}
            </div>
          ) : (
            <div className="space-y-6 p-6 pt-8">
              <Skeleton className="h-8 w-48 bg-skeleton" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 bg-skeleton" />
                ))}
              </div>
              <Skeleton className="h-8 w-64 bg-skeleton" />
              <div className="grid grid-cols-3 gap-6 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="aspect-square w-full bg-skeleton" />
                    <Skeleton className="h-3 w-4/5 bg-skeleton" />
                    <Skeleton className="h-2.5 w-1/2 bg-skeleton-subtle" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        <LoadingNowPlayingSkeleton />
      </div>
      <LoadingPlayerBarSkeleton />
    </div>
  );
}
