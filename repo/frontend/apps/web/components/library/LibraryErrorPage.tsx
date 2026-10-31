"use client";

import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useI18n } from "@/store/module/i18n";
import { LibraryStatePage } from "./LibraryStatePage";

export function LibraryErrorPage({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const { t } = useI18n();

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
