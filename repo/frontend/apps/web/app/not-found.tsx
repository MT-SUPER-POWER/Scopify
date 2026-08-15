"use client";

import { AppStatusPage } from "@/components/shared/AppStatusPage";
import { useI18n } from "@/store/module/i18n";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <AppStatusPage
      description={t("errorPage.notFound.description")}
      homeLabel={t("ui.backToHome")}
      statusCode="404"
      title={t("errorPage.notFound.title")}
    />
  );
}
