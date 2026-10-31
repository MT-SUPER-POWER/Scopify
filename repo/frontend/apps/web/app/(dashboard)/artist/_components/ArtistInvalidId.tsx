"use client";

import { useTranslation } from "react-i18next";

export function ArtistInvalidId() {
  const { t } = useTranslation();

  return <div className="p-8">{t("artist.page.invalidId")}</div>;
}
