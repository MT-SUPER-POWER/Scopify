"use client";

import { RecommendedVoiceLists } from "./_components/RecommendedVoiceLists";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useI18n } from "@/store/module/i18n";

export default function HomeVoicesSlot() {
  const { t } = useI18n();
  return (
    <QueryBoundary resetKey="home:voices" title={t("home.recommendedVoiceLists")} compact>
      <RecommendedVoiceLists />
    </QueryBoundary>
  );
}
