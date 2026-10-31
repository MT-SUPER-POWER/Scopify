import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useI18n } from "@/store/module/i18n";

export function SearchOfflineState({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mb-6">
      <NetworkRetryState
        compact
        title={t("network.offline.title")}
        subtitle={t("network.offline.subtitle")}
        actionLabel={t("network.action.refresh")}
        isRetrying={isRetrying}
        onRetry={onRetry}
      />
    </div>
  );
}
