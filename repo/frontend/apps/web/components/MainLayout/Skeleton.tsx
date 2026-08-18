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
        "relative flex h-dvh w-full flex-col bg-surface font-sans text-content",
        "gap-2 overflow-hidden p-2 select-none",
      )}
    >
      <div className="flex min-h-0 flex-1 gap-2">
        <LoadingSidebarSkeleton />
        <section className="relative min-w-0 flex-1 overflow-hidden rounded-lg bg-surface-raised">
          <LoadingHeaderSkeleton />
          {content ? (
            // Some desktop scroll enhancers annotate this scrollable shell before React hydrates.
            <div suppressHydrationWarning className="size-full overflow-hidden">
              {content}
            </div>
          ) : (
            <div className="space-y-6 p-6 pt-24">
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
      </div>
      <LoadingPlayerBarSkeleton />
      {title ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-surface-overlay p-6 text-center shadow-floating backdrop-blur-xl">
            <div className="text-lg font-semibold text-foreground">{title}</div>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
            {actionLabel && onAction ? (
              <button
                type="button"
                onClick={onAction}
                className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-brand-hover"
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
