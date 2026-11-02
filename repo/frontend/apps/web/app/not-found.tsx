"use client";

import { AppStatusPage } from "@/components/shared/AppStatusPage";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <AppStatusPage
      description={t("errorPage.notFound.description")}
      homeLabel={t("ui.backToHome")}
      statusCode="404"
      title={t("errorPage.notFound.title")}
    />
  );
}
