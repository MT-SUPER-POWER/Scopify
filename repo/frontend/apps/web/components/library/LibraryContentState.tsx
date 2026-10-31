"use client";

import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useTranslation } from "react-i18next";

import type { LibraryContentStateProps } from "@/types/library/components";
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
  const { t } = useTranslation();

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
