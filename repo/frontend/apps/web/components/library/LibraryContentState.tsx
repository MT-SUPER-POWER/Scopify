"use client";

import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useI18n } from "@/store/module/i18n";
import type { LibraryContentStateProps } from "@/types/components/library";
import { LibraryLoading } from "./LibraryLoading";

export function LibraryContentState({
  children,
  emptyState,
  hasItems,
  isError,
  isLoading,
  isRetrying,
  loadingContent,
  onRetry,
}: LibraryContentStateProps) {
  const { t } = useI18n();

  if (isLoading) return loadingContent ?? <LibraryLoading />;

  if (isError) {
    return (
      <NetworkRetryState
        title={t("network.offline.title")}
        subtitle={t("network.offline.subtitle")}
        actionLabel={t("network.action.refresh")}
        isRetrying={isRetrying}
        onRetry={onRetry}
      />
    );
  }

  return hasItems ? children : emptyState;
}
