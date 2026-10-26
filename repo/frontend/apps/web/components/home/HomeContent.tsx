"use client";

import { FeaturedActivitiesCarousel } from "@/components/home/FeaturedActivitiesCarousel";
import { HomeGreetingContent, HomePlaylistContent } from "@/components/home/HomePlaylistContent";
import {
  HomeArtistTopSongsContent,
  HomeSuggestedArtistsContent,
} from "@/components/home/HomeArtistContent";
import {
  HomeNewAlbumsContent,
  HomeNewSongsContent,
  HomeToplistsContent,
} from "@/components/home/HomeMusicContent";
import {
  HomeRecentPlaylistsContent,
  HomeFollowedAlbumsContent,
} from "@/components/home/HomeAccountContent";
import { HomeVoicesContent } from "@/components/home/HomeVoicesContent";
import { AppBackground } from "@/components/shared/AppBackground";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useHomeGreeting } from "@/hooks/home/useHomeGreeting";
import { useHomePlaybackActions } from "@/hooks/home/useHomePlaybackActions";
import { useI18n } from "@/store/module/i18n";

export function HomeContent() {
  const { t } = useI18n();
  const { greeting, dateInfo, accountId } = useHomeGreeting();
  const actions = useHomePlaybackActions();
  return (
    <div className="relative min-h-screen bg-surface-raised pb-24 font-sans">
      <AppBackground />
      <div className="relative z-10 mx-auto w-full max-w-400 space-y-7 px-4 py-6 sm:px-6">
        <QueryBoundary resetKey="home:greeting" title={greeting} compact>
          <HomeGreetingContent actions={actions} greeting={greeting} dateInfo={dateInfo} />
        </QueryBoundary>
        <QueryBoundary
          resetKey={`home:playlists:${accountId}`}
          title={t("home.madeFor", { name: t("home.you") })}
          compact
        >
          <HomePlaylistContent actions={actions} />
        </QueryBoundary>
        <QueryBoundary
          resetKey={`home:recent:${accountId}`}
          title={t("home.recentlyPlayedPlaylists")}
          compact
        >
          <HomeRecentPlaylistsContent actions={actions} />
        </QueryBoundary>
        <QueryBoundary
          resetKey={`home:artist-songs:${accountId}`}
          title={t("home.artistTopSongs")}
          compact
        >
          <HomeArtistTopSongsContent actions={actions} />
        </QueryBoundary>
        <QueryBoundary resetKey="home:artists" title={t("home.suggestedArtists")} compact>
          <HomeSuggestedArtistsContent />
        </QueryBoundary>
        <QueryBoundary
          resetKey={`home:followed-albums:${accountId}`}
          title={t("home.followedArtistsAlbums")}
          compact
        >
          <HomeFollowedAlbumsContent actions={actions} />
        </QueryBoundary>
        <QueryBoundary resetKey="home:albums" title={t("home.newAlbums")} compact>
          <HomeNewAlbumsContent actions={actions} />
        </QueryBoundary>
        <QueryBoundary resetKey="home:songs" title={t("home.newSongs")} compact>
          <HomeNewSongsContent actions={actions} />
        </QueryBoundary>
        <QueryBoundary resetKey="home:voices" title={t("home.recommendedVoiceLists")} compact>
          <HomeVoicesContent />
        </QueryBoundary>
        <QueryBoundary resetKey="home:banners" compact>
          <FeaturedActivitiesCarousel />
        </QueryBoundary>
        <QueryBoundary resetKey="home:toplists" title={t("home.toplists")} compact>
          <HomeToplistsContent actions={actions} />
        </QueryBoundary>
      </div>
    </div>
  );
}
