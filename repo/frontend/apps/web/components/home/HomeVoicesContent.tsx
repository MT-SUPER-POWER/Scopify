"use client";

import { RecommendedVoiceLists } from "@/components/home/RecommendedVoiceLists";
import { HomeSectionPending } from "@/components/home/HomeSectionPending";
import { useRecommendedVoiceListsQuery } from "@/hooks/home/useHomeQueries";
import { toRecommendedVoice } from "@/lib/home/voiceAdapter";
import { useI18n } from "@/store/module/i18n";
import type { Voice } from "@/types/search";

export function HomeVoicesContent() {
  const { t } = useI18n();
  const query = useRecommendedVoiceListsQuery();
  if (query.isPending)
    return (
      <HomeSectionPending
        isPaused={query.fetchStatus === "paused"}
        kind="voices"
        titleKey="home.recommendedVoiceLists"
      />
    );
  const voices = (query.data?.data?.recommendVoiceVOS ?? [])
    .map((voice) =>
      toRecommendedVoice(
        voice,
        t("home.voiceListMeta"),
        t("common.meta.unknownAlbum"),
        t("common.meta.unknownSong"),
      ),
    )
    .filter((voice): voice is Voice => voice !== null);
  return (
    <RecommendedVoiceLists
      voices={voices}
      isRefreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
    />
  );
}
