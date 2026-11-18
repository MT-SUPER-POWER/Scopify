"use client";

import { RecommendedVoiceLists } from "./_components/RecommendedVoiceLists";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { HomeSectionPending } from "../_components/HomeSectionPending";
import { useTranslation } from "react-i18next";

export default function HomeVoicesSlot() {
  const { t } = useTranslation();
  return (
    <QueryBoundary
      resetKey="home:voices"
      title={t("home.recommendedVoiceLists")}
      compact
      renderWaiting={() => (
        <HomeSectionPending
          kind="voices"
          titleKey="home.recommendedVoiceLists"
          waitingForConnection
        />
      )}
    >
      <RecommendedVoiceLists />
    </QueryBoundary>
  );
}
