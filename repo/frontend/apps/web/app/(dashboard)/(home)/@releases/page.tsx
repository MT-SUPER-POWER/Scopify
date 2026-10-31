"use client";

import { Suspense } from "react";
import { NewAlbumsSection } from "./_components/NewAlbumsSection";
import { NewSongsSection } from "./_components/NewSongsSection";
import { HomeSectionPending } from "../_components/HomeSectionPending";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useI18n } from "@/store/module/i18n";

/** 新专辑与新歌各一个边界和各自的 Suspense：互不影响，各自显示骨架。 */
export default function HomeReleasesSlot() {
  const { t } = useI18n();
  return (
    <>
      <QueryBoundary resetKey="home:albums" title={t("home.newAlbums")} compact>
        <Suspense fallback={<HomeSectionPending kind="grid" titleKey="home.newAlbums" />}>
          <NewAlbumsSection />
        </Suspense>
      </QueryBoundary>
      <QueryBoundary resetKey="home:songs" title={t("home.newSongs")} compact>
        <Suspense fallback={<HomeSectionPending kind="songs" titleKey="home.newSongs" />}>
          <NewSongsSection />
        </Suspense>
      </QueryBoundary>
    </>
  );
}
