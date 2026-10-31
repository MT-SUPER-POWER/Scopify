"use client";

import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useTranslation } from "react-i18next";

import { LibraryStatePage } from "./LibraryStatePage";

export function LibraryErrorPage({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <LibraryStatePage>
      <NetworkRetryState
        title={t("network.offline.title")}
        subtitle={t("network.offline.subtitle")}
        actionLabel={t("network.action.refresh")}
        isRetrying={isRetrying}
        onRetry={onRetry}
      />
    </LibraryStatePage>
  );
}
