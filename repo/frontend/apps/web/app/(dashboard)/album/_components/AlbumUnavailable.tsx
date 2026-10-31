"use client";

import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useI18n } from "@/store/module/i18n";

export function AlbumUnavailable({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();

  return (
    <div className="pt-8 pb-24">
      <NetworkRetryState
        title={t("network.offline.title")}
        subtitle={t("album.empty.unavailable")}
        actionLabel={t("network.action.refresh")}
        onRetry={onRetry}
      />
    </div>
  );
}
