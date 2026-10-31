"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/store/module/i18n";

export function PodcastsTabList() {
  const { t } = useI18n();

  return (
    <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0">
      <TabsTrigger
        value="subscribed"
        className="shrink-0 rounded-full border border-content/10 bg-content/5"
      >
        {t("library.podcasts.subscribed")}
      </TabsTrigger>
      <TabsTrigger
        value="created"
        className="shrink-0 rounded-full border border-content/10 bg-content/5"
      >
        {t("library.podcasts.created")}
      </TabsTrigger>
      <TabsTrigger
        value="liked"
        className="shrink-0 rounded-full border border-content/10 bg-content/5"
      >
        {t("library.podcasts.likedVoices")}
      </TabsTrigger>
    </TabsList>
  );
}
