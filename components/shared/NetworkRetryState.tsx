"use client";

import { RefreshCw, WifiOff } from "lucide-react";

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
          ? "flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2"
          : "flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-6 py-8 text-center"
      }
    >
      <div
        className={compact ? "flex min-w-0 items-center gap-3" : "flex flex-col items-center gap-2"}
      >
        <WifiOff className={compact ? "size-5 shrink-0 text-red-300" : "size-9 text-red-300"} />
        <div className={compact ? "min-w-0" : ""}>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ff3b5c] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#ff5270] disabled:cursor-wait disabled:opacity-70"
      >
        <RefreshCw className={`size-3.5 ${isRetrying ? "animate-spin" : ""}`} />
        {actionLabel}
      </button>
    </div>
  );
}
