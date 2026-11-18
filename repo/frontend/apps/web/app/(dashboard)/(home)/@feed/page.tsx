"use client";

import { FeedShelves } from "./_components/FeedShelves";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useHome } from "../_components/HomeProvider";
import { HomeSectionPending } from "../_components/HomeSectionPending";
import { useTranslation } from "react-i18next";

/** 平台自带的首页推荐：一个边界，失败时整块可重试。 */
export default function HomeFeedSlot() {
  const { t } = useTranslation();
  const { accountId } = useHome();
  return (
    <QueryBoundary
      resetKey={`home:feed:${accountId}`}
      title={t("home.feed")}
      compact
      renderWaiting={() => (
        <HomeSectionPending kind="grid" titleKey="home.feed" waitingForConnection />
      )}
    >
      <FeedShelves />
    </QueryBoundary>
  );
}
