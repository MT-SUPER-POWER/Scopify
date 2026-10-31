"use client";

import { RecommendedVoiceLists } from "./_components/RecommendedVoiceLists";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useTranslation } from "react-i18next";

export default function HomeVoicesSlot() {
  const { t } = useTranslation();
  return (
    <QueryBoundary resetKey="home:voices" title={t("home.recommendedVoiceLists")} compact>
      <RecommendedVoiceLists />
    </QueryBoundary>
  );
}
