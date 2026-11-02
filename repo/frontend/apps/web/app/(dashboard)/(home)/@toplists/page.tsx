"use client";

import { ToplistSection } from "./_components/ToplistSection";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useTranslation } from "react-i18next";

export default function HomeToplistsSlot() {
  const { t } = useTranslation();
  return (
    <QueryBoundary resetKey="home:toplists" title={t("home.toplists")} compact>
      <ToplistSection />
    </QueryBoundary>
  );
}
