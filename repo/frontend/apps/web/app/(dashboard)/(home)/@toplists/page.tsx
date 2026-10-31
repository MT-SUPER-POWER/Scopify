"use client";

import { ToplistSection } from "./_components/ToplistSection";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useI18n } from "@/store/module/i18n";

export default function HomeToplistsSlot() {
  const { t } = useI18n();
  return (
    <QueryBoundary resetKey="home:toplists" title={t("home.toplists")} compact>
      <ToplistSection />
    </QueryBoundary>
  );
}
