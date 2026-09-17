"use client";

import { FeaturedActivitiesCarousel } from "@/components/home/FeaturedActivitiesCarousel";
import { HomeGreetingSection } from "@/components/home/HomeGreetingSection";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { NewAlbumsSection } from "@/components/home/NewAlbumsSection";
import { NewSongsSection } from "@/components/home/NewSongsSection";
import { PersonalizedPlaylists } from "@/components/home/PersonalizedPlaylists";
import { RecommendedVoiceLists } from "@/components/home/RecommendedVoiceLists";
import { SuggestedArtists } from "@/components/home/SuggestedArtists";
import { ToplistSection } from "@/components/home/ToplistSection";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useHomeData } from "@/hooks/home/useHomeData";
import { getHomeGreetingKey } from "@/lib/home/greeting";
import { AppBackground } from "@/components/shared/AppBackground";
import { useI18n } from "@/store/module/i18n";

export function HomeContent() {
  const { t } = useI18n();
  const greetingKey = getHomeGreetingKey();
  const {
    playlists,
    recommendedVoiceLists,
    isRefreshingVoiceLists,
    bannerPlaylist,
    suggestedArtists,
    newSongs,
    toplists,
    newAlbums,
    isLoading,
    isUnavailable,
    loadingPlayId,
    hasError,
    dateInfo,
    userName,
    isLogin,
    handlePlayPlaylist,
    handlePlaySong,
    handlePlayAllNewSongs,
    handlePlayAlbum,
    refreshRecommendedVoiceLists,
    fetchHomeData,
  } = useHomeData();

  const isUnknown =
    !userName ||
    userName === "未知用户" ||
    userName === "未知使用者" ||
    userName === "Unknown User" ||
    userName === t("common.meta.unknownUser") ||
    userName.trim() === "";

  const hasValidUser = isLogin && !isUnknown;

  const greetingText = hasValidUser ? `${t(greetingKey)}, ${userName}` : t(greetingKey);

  return (
    <div className="relative min-h-screen bg-surface-raised pb-24 font-sans">
      <AppBackground />

      {isUnavailable ? (
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-400 flex-col p-6 pt-20">
          <h1 className="text-2xl leading-tight font-bold tracking-tight text-content">
            {greetingText}
          </h1>
          <main className="flex flex-1 items-center justify-center pb-28">
            <NetworkRetryState
              title={t("network.offline.title")}
              subtitle={t("network.offline.subtitle")}
              actionLabel={t("network.action.refresh")}
              isRetrying={isLoading}
              onRetry={() => void fetchHomeData()}
            />
          </main>
        </div>
      ) : isLoading && playlists.length === 0 ? (
        <HomePageSkeleton />
      ) : (
        <div className="relative z-10 mx-auto w-full max-w-400 animate-in space-y-7 px-4 pt-20 pb-6 duration-500 fade-in sm:px-6">
          <HomeGreetingSection
            dateInfo={dateInfo}
            greeting={greetingText}
            loadingPlayId={loadingPlayId}
            onPlayPlaylist={handlePlayPlaylist}
            playlists={bannerPlaylist}
          />

          <PersonalizedPlaylists
            playlists={playlists}
            loadingPlayId={loadingPlayId}
            onPlayPlaylist={handlePlayPlaylist}
          />

          <NewSongsSection
            songs={newSongs}
            onPlaySong={handlePlaySong}
            onPlayAll={handlePlayAllNewSongs}
          />

          <FeaturedActivitiesCarousel />

          <ToplistSection
            toplists={toplists}
            loadingPlayId={loadingPlayId}
            onPlayToplist={handlePlayPlaylist}
          />

          <NewAlbumsSection
            albums={newAlbums}
            loadingPlayId={loadingPlayId}
            onPlayAlbum={handlePlayAlbum}
          />

          <RecommendedVoiceLists
            voices={recommendedVoiceLists}
            isRefreshing={isRefreshingVoiceLists}
            onRefresh={refreshRecommendedVoiceLists}
          />

          {hasError && (
            <NetworkRetryState
              compact
              title={t("network.offline.title")}
              subtitle={t("network.offline.subtitle")}
              actionLabel={t("network.action.refresh")}
              isRetrying={isLoading}
              onRetry={() => void fetchHomeData()}
            />
          )}

          <SuggestedArtists artists={suggestedArtists} />
        </div>
      )}
    </div>
  );
}
