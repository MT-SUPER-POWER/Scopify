"use client";

import { RefreshCw } from "lucide-react";

import type { NetworkRetryStateProps } from "@/types/components/network";

export function NetworkRetryState({
  actionLabel,
  compact,
  isRetrying = false,
  onRetry,
  subtitle,
  title,
}: NetworkRetryStateProps) {
  return (
    <div
      aria-live="polite"
      role="status"
      className={
        compact
          ? "flex min-h-44 flex-col items-center justify-center gap-4 px-6 py-8 text-center"
          : "flex min-h-64 flex-col items-center justify-center gap-5 px-6 py-12 text-center"
      }
    >
      <div className="max-w-md">
        <p
          className={
            compact ? "text-base font-bold text-content" : "text-xl font-bold text-content"
          }
        >
          {title}
        </p>
        <p
          className={
            compact ? "mt-1.5 text-sm text-content-muted" : "mt-2 text-sm text-content-muted"
          }
        >
          {subtitle}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        aria-label={actionLabel}
        title={actionLabel}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-brand-foreground shadow-brand transition-transform hover:scale-105 hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised focus-visible:outline-none active:scale-100 disabled:cursor-wait disabled:opacity-50 disabled:hover:scale-100"
      >
        <RefreshCw className={`size-4 ${isRetrying ? "animate-spin" : ""}`} />
        {actionLabel}
      </button>
    </div>
  );
}
