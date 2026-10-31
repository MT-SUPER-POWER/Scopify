"use client";

import { useI18n } from "@/store/module/i18n";

export function ArtistInvalidId() {
  const { t } = useI18n();

  return <div className="p-8">{t("artist.page.invalidId")}</div>;
}
