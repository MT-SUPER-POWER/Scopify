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
            compact ? "text-content text-base font-bold" : "text-content text-xl font-bold"
          }
        >
          {title}
        </p>
        <p
          className={
            compact ? "text-content-muted mt-1.5 text-sm" : "text-content-muted mt-2 text-sm"
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
        className="bg-brand text-brand-foreground shadow-brand hover:bg-brand-hover focus-visible:ring-brand focus-visible:ring-offset-surface-raised inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-bold transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-100 disabled:cursor-wait disabled:opacity-50 disabled:hover:scale-100"
      >
        <RefreshCw className={`size-4 ${isRetrying ? "animate-spin" : ""}`} />
        {actionLabel}
      </button>
    </div>
  );
}
