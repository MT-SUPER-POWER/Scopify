"use client";

import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useTranslation } from "react-i18next";

interface Props {
  isRefreshing: boolean;
  onRetry: () => void;
}

export function ArtistRefetchError({ isRefreshing, onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <div className="px-6 pt-6 md:px-8">
      <NetworkRetryState
        compact
        title={t("network.offline.title")}
        subtitle={t("network.offline.subtitle")}
        actionLabel={t("network.action.refresh")}
        isRetrying={isRefreshing}
        onRetry={onRetry}
      />
    </div>
  );
}
