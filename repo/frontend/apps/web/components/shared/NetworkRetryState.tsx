"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";

import { QuietState } from "@/components/shared/QuietState";
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
    <QuietState
      compact={compact}
      icon={CloudOff}
      title={title}
      description={subtitle}
      action={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="rounded-full bg-content/5 text-content hover:bg-content/10"
        >
          <RefreshCw className={isRetrying ? "animate-spin" : undefined} />
          {actionLabel}
        </Button>
      }
    />
  );
}
