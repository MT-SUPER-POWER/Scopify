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
      className={
        compact
          ? "flex min-h-44 flex-col items-center justify-center gap-4 px-6 py-8 text-center"
          : "flex min-h-64 flex-col items-center justify-center gap-5 px-6 py-12 text-center"
      }
    >
      <div className="max-w-md">
        <p className={compact ? "text-base font-bold text-white" : "text-xl font-bold text-white"}>
          {title}
        </p>
        <p className={compact ? "mt-1.5 text-sm text-[#b3b3b3]" : "mt-2 text-sm text-[#b3b3b3]"}>
          {subtitle}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        aria-label={actionLabel}
        title={actionLabel}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black transition-transform hover:scale-105 hover:bg-[#3be477] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] focus-visible:outline-none active:scale-100 disabled:cursor-wait disabled:opacity-50 disabled:hover:scale-100"
      >
        <RefreshCw className={`size-4 ${isRetrying ? "animate-spin" : ""}`} />
        {actionLabel}
      </button>
    </div>
  );
}
