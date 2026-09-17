"use client";

import { ArtistTopSongsSection } from "@/components/home/ArtistTopSongsSection";
import { FeaturedActivitiesCarousel } from "@/components/home/FeaturedActivitiesCarousel";
import { FollowedAlbumsSection } from "@/components/home/FollowedAlbumsSection";
import { HomeGreetingSection } from "@/components/home/HomeGreetingSection";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { NewAlbumsSection } from "@/components/home/NewAlbumsSection";
import { NewSongsSection } from "@/components/home/NewSongsSection";
import { PersonalizedPlaylists } from "@/components/home/PersonalizedPlaylists";
import { RecentlyPlayedPlaylists } from "@/components/home/RecentlyPlayedPlaylists";
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
    recentPlaylists,
    artistTopList,
    followedAlbums,
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
    handlePlayArtistTopSongs,
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
          {/* 1. 欢迎语与快速访问 */}
          <HomeGreetingSection
            dateInfo={dateInfo}
            greeting={greetingText}
            loadingPlayId={loadingPlayId}
            onPlayPlaylist={handlePlayPlaylist}
            playlists={bannerPlaylist}
          />

          {/* 2. 为你推荐 */}
          <PersonalizedPlaylists
            playlists={playlists}
            loadingPlayId={loadingPlayId}
            onPlayPlaylist={handlePlayPlaylist}
          />

          {/* 3. 最近播放歌单 */}
          <RecentlyPlayedPlaylists
            playlists={recentPlaylists}
            loadingPlayId={loadingPlayId}
            onPlayPlaylist={handlePlayPlaylist}
          />

          {/* 4. 艺人热门歌曲 (THIS IS 风格) */}
          <ArtistTopSongsSection
            artists={artistTopList}
            loadingPlayId={loadingPlayId}
            onPlayArtist={handlePlayArtistTopSongs}
          />

          {/* 5. 推荐歌手 */}
          <SuggestedArtists artists={suggestedArtists} />

          {/* 6. 关注歌手专辑 */}
          <FollowedAlbumsSection
            albums={followedAlbums}
            loadingPlayId={loadingPlayId}
            onPlayAlbum={handlePlayAlbum}
          />

          {/* 7. 新碟上架 */}
          <NewAlbumsSection
            albums={newAlbums}
            loadingPlayId={loadingPlayId}
            onPlayAlbum={handlePlayAlbum}
          />

          {/* 8. 新歌速递 */}
          <NewSongsSection
            songs={newSongs}
            onPlaySong={handlePlaySong}
            onPlayAll={handlePlayAllNewSongs}
          />

          {/* 9. 推荐播客声音 */}
          <RecommendedVoiceLists
            voices={recommendedVoiceLists}
            isRefreshing={isRefreshingVoiceLists}
            onRefresh={refreshRecommendedVoiceLists}
          />

          {/* 10. 精选活动 3D 轮播 */}
          <FeaturedActivitiesCarousel />

          {/* 11. 官方排行榜 Hero 轮播压轴大卡 */}
          <ToplistSection
            toplists={toplists}
            loadingPlayId={loadingPlayId}
            onPlayToplist={handlePlayPlaylist}
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
        </div>
      )}
    </div>
  );
}
