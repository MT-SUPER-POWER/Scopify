"use client";

import { NewAlbumsSection } from "./_components/NewAlbumsSection";
import { NewSongsSection } from "./_components/NewSongsSection";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useI18n } from "@/store/module/i18n";

/** 新专辑与新歌各一个边界：互不影响。 */
export default function HomeReleasesSlot() {
  const { t } = useI18n();
  return (
    <>
      <QueryBoundary resetKey="home:albums" title={t("home.newAlbums")} compact>
        <NewAlbumsSection />
      </QueryBoundary>
      <QueryBoundary resetKey="home:songs" title={t("home.newSongs")} compact>
        <NewSongsSection />
      </QueryBoundary>
    </>
  );
}
