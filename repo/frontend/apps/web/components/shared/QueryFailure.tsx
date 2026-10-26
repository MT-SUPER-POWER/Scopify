"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { QuietState } from "@/components/shared/QuietState";
import { getQueryFailureKind } from "@/lib/query/errorPolicy";
import { useI18n } from "@/store/module/i18n";
import type { QueryFailureProps } from "@/types/components/queryBoundary";

export function QueryFailure({ error, onRetry, title, compact }: QueryFailureProps) {
  const { t } = useI18n();
  const kind = getQueryFailureKind(error);
  return (
    <section aria-label={title} className="space-y-3">
      {title ? <h2 className="text-xl font-bold text-content">{title}</h2> : null}
      {kind === "network" ? (
        <NetworkRetryState
          compact={compact}
          title={t("network.offline.title")}
          subtitle={t("network.offline.subtitle")}
          actionLabel={t("common.action.retry")}
          onRetry={onRetry}
        />
      ) : (
        <QuietState
          compact={compact}
          icon={AlertTriangle}
          title={kind === "unexpected" ? t("errorPage.unexpected.title") : error.message}
          description={kind === "unexpected" ? t("errorPage.unexpected.description") : undefined}
          action={
            <Button variant="secondary" size="sm" onClick={onRetry}>
              {t("common.action.retry")}
            </Button>
          }
        />
      )}
    </section>
  );
}
