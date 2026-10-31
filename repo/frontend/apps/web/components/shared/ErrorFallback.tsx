"use client";

import { useEffect } from "react";

import { AppStatusPage } from "@/components/shared/AppStatusPage";
import { reportFailure } from "@/lib/web/errorTracking";
import { useTranslation } from "react-i18next";

import type { ErrorFallbackProps } from "@/types/shared/errorComponents";

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  const { t } = useTranslation();

  useEffect(() => {
    reportFailure({
      context: error.digest ? { digest: error.digest } : undefined,
      error,
      event: "next.error_boundary",
      message: "Next.js error boundary rendered",
      source: "runtime",
    });
  }, [error]);

  return (
    <AppStatusPage
      description={t("errorPage.unexpected.description")}
      homeLabel={t("ui.backToHome")}
      onRetry={reset}
      retryLabel={t("common.action.retry")}
      statusCode="500"
      title={t("errorPage.unexpected.title")}
    />
  );
}
