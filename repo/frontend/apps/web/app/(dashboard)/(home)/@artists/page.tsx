"use client";

import { ArtistTopSongsSection } from "./_components/ArtistTopSongsSection";
import { FollowedAlbumsSection } from "./_components/FollowedAlbumsSection";
import { SuggestedArtists } from "./_components/SuggestedArtists";
import { useHome } from "../_components/HomeProvider";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useI18n } from "@/store/module/i18n";

/** 歌手相关三个栏目各一个边界：互不影响。 */
export default function HomeArtistsSlot() {
  const { t } = useI18n();
  const { accountId } = useHome();
  return (
    <>
      <QueryBoundary
        resetKey={`home:artist-songs:${accountId}`}
        title={t("home.artistTopSongs")}
        compact
      >
        <ArtistTopSongsSection />
      </QueryBoundary>
      <QueryBoundary resetKey="home:artists" title={t("home.suggestedArtists")} compact>
        <SuggestedArtists />
      </QueryBoundary>
      <QueryBoundary
        resetKey={`home:followed-albums:${accountId}`}
        title={t("home.followedArtistsAlbums")}
        compact
      >
        <FollowedAlbumsSection />
      </QueryBoundary>
    </>
  );
}
