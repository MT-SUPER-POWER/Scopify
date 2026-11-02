"use client";

import { PersonalizedPlaylists } from "./_components/PersonalizedPlaylists";
import { RecentlyPlayedPlaylists } from "./_components/RecentlyPlayedPlaylists";
import { useHome } from "../_components/HomeProvider";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useTranslation } from "react-i18next";

/** 个性化歌单与最近播放各一个边界：互不影响。 */
export default function HomePlaylistsSlot() {
  const { t } = useTranslation();
  const { accountId } = useHome();
  return (
    <>
      <QueryBoundary
        resetKey={`home:playlists:${accountId}`}
        title={t("home.madeFor", { name: t("home.you") })}
        compact
      >
        <PersonalizedPlaylists />
      </QueryBoundary>
      <QueryBoundary
        resetKey={`home:recent:${accountId}`}
        title={t("home.recentlyPlayedPlaylists")}
        compact
      >
        <RecentlyPlayedPlaylists />
      </QueryBoundary>
    </>
  );
}
