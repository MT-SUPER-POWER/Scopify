"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { BackendStatusIndicatorProps } from "@/types/components/settings";

export function BackendStatusIndicator({ status }: BackendStatusIndicatorProps) {
  const { t } = useI18n();
  const state = status?.state ?? "stopped";
  const label = t(`settings.localBackend.status.${state}`);
  const isRunning = state === "running";
  const isStarting = state === "starting";
  const isError = state === "error";

  return (
    <span
      aria-label={label}
      className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium"
      title={status?.error ?? label}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          isRunning && "bg-success",
          isStarting && "bg-warning animate-pulse",
          isError && "bg-danger",
          !isRunning && !isStarting && !isError && "bg-muted-foreground/50",
        )}
      />
      {label}
    </span>
  );
}
