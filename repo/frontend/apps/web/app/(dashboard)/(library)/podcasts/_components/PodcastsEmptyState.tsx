"use client";

import { Podcast } from "lucide-react";
import { QuietState } from "@/components/shared/QuietState";
import { useI18n } from "@/store/module/i18n";

export function PodcastsEmptyState() {
  const { t } = useI18n();

  return (
    <QuietState
      icon={Podcast}
      title={t("library.empty.podcasts.title")}
      description={t("library.empty.podcasts.description")}
    />
  );
}
