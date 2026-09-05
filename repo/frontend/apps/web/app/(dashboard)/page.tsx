"use client";

import { FeaturedActivitiesCarousel } from "@/components/home/FeaturedActivitiesCarousel";
import { HomeGreetingSection } from "@/components/home/HomeGreetingSection";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { PersonalizedPlaylists } from "@/components/home/PersonalizedPlaylists";
import { RecommendedVoiceLists } from "@/components/home/RecommendedVoiceLists";
import { SuggestedArtists } from "@/components/home/SuggestedArtists";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useRouteRestorationPlaceholder } from "@/components/shared/NavigationScrollProvider";
import { getTimeTheme, useHomeData } from "@/hooks/home/useHomeData";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

export default function HomePage() {
  useRouteRestorationPlaceholder(HomePageSkeleton);
  const { t } = useI18n();
  const timeTheme = getTimeTheme();
  const {
    playlists,
    recommendedVoiceLists,
    isRefreshingVoiceLists,
    bannerPlaylist,
    suggestedArtists,
    isLoading,
    isUnavailable,
    loadingPlayId,
    hasError,
    dateInfo,
    userName,
    isLogin,
    handlePlayPlaylist,
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

  const greetingText = hasValidUser
    ? `${t(timeTheme.greetingKey)}, ${userName}`
    : t(timeTheme.greetingKey);

  return (
    <div className="relative min-h-screen bg-surface-raised pb-24 font-sans">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-0 h-full bg-linear-to-b",
          timeTheme.gradient,
        )}
      />

      {isUnavailable ? (
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-400 flex-col p-6 pt-20">
          <h1 className="text-3xl leading-none font-bold tracking-tight text-content">
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
        <div className="relative z-10 mx-auto w-full max-w-400 animate-in space-y-10 p-6 pt-20 duration-500 fade-in">
          <HomeGreetingSection
            dateInfo={dateInfo}
            greeting={greetingText}
            loadingPlayId={loadingPlayId}
            onPlayPlaylist={handlePlayPlaylist}
            playlists={bannerPlaylist}
          />

          <PersonalizedPlaylists
            playlists={playlists}
            userName={hasValidUser ? userName : undefined}
            loadingPlayId={loadingPlayId}
            onPlayPlaylist={handlePlayPlaylist}
          />

          <FeaturedActivitiesCarousel />

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
