"use client";

import { useI18n } from "@/store/module/i18n";

export function AlbumInvalidId() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen w-full items-center justify-center text-content-muted">
      <span className="text-lg font-medium">{t("album.empty.invalidId")}</span>
    </div>
  );
}
