"use client";

import type { ReactNode } from "react";
import {
  LoadingHeaderSkeleton,
  LoadingPlayerBarSkeleton,
  LoadingSidebarSkeleton,
} from "@/components/MainLayout/LoadingChrome";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MainLayoutSkeletonProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  content?: ReactNode;
}

/**
 * Loading shell for the desktop layout.
 * When `title` is omitted, renders as a silent skeleton (no overlay text).
 */
export default function MainLayoutSkeleton({
  title,
  description,
  actionLabel,
  onAction,
  content,
}: MainLayoutSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-surface text-content relative flex h-dvh w-full flex-col font-sans",
        "gap-2 overflow-hidden p-2 select-none",
      )}
    >
      <div className="flex min-h-0 flex-1 gap-2">
        <LoadingSidebarSkeleton />
        <section className="bg-surface-raised relative min-w-0 flex-1 overflow-hidden rounded-lg">
          <LoadingHeaderSkeleton />
          {content ? (
            // Some desktop scroll enhancers annotate this scrollable shell before React hydrates.
            <div suppressHydrationWarning className="size-full overflow-hidden">
              {content}
            </div>
          ) : (
            <div className="space-y-6 p-6 pt-24">
              <Skeleton className="bg-skeleton h-8 w-48" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="bg-skeleton h-16" />
                ))}
              </div>
              <Skeleton className="bg-skeleton h-8 w-64" />
              <div className="grid grid-cols-3 gap-6 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="bg-skeleton aspect-square w-full" />
                    <Skeleton className="bg-skeleton h-3 w-4/5" />
                    <Skeleton className="bg-skeleton-subtle h-2.5 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
      <LoadingPlayerBarSkeleton />
      {title ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="bg-surface-overlay shadow-floating border-border pointer-events-auto w-full max-w-md rounded-2xl border p-6 text-center backdrop-blur-xl">
            <div className="text-foreground text-lg font-semibold">{title}</div>
            {description ? (
              <p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p>
            ) : null}
            {actionLabel && onAction ? (
              <button
                type="button"
                onClick={onAction}
                className="bg-primary text-primary-foreground hover:bg-brand-hover mt-5 rounded-full px-5 py-2 text-sm font-semibold transition"
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
