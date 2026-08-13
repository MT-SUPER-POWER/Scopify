"use client";

import { Loader2, Play } from "lucide-react";
import Image from "next/image";

import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { FeaturedActivitiesCarousel } from "@/components/home/FeaturedActivitiesCarousel";
import { GridCard } from "@/components/home/GridCard";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { RecommendedVoiceLists } from "@/components/home/RecommendedVoiceLists";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useRouteRestorationPlaceholder } from "@/components/shared/NavigationScrollProvider";
import { getTimeTheme, useHomeData } from "@/hooks/home/useHomeData";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn, formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

export default function HomePage() {
  useRouteRestorationPlaceholder(HomePageSkeleton);
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const timeTheme = getTimeTheme();
  const {
    playlists,
    recommendedVoiceLists,
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
    fetchHomeData,
  } = useHomeData();

  return (
    <div className="bg-surface-raised relative min-h-screen pb-24 font-sans">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-0 h-full bg-linear-to-b",
          timeTheme.gradient,
        )}
      />

      {isUnavailable ? (
        <div className="relative z-10 flex min-h-screen flex-col p-6 pt-20">
          <h1 className="text-content text-3xl leading-none font-bold tracking-tight">
            {isLogin && userName
              ? `${t(timeTheme.greetingKey)}, ${userName}`
              : t(timeTheme.greetingKey)}
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
        <div className="animate-in fade-in relative z-10 space-y-8 p-6 pt-20 duration-500">
          <section>
            <CollapsibleSection
              title={
                <div className="flex items-center gap-4">
                  <h1 className="text-content text-3xl leading-none font-bold tracking-tight">
                    {isLogin && userName
                      ? `${t(timeTheme.greetingKey)}, ${userName}`
                      : t(timeTheme.greetingKey)}
                  </h1>
                </div>
              }
              collapsedHeight="160px"
            >
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <div
                  onClick={() => smartRouter.push("/playlist/?isDailyRecommend=true")}
                  className="bg-content/10 hover:bg-content/20 group relative flex h-16 cursor-pointer items-center overflow-hidden rounded-md pr-4 transition-colors"
                >
                  <div className="bg-calendar-surface shadow-calendar z-10 flex size-16 shrink-0 flex-col overflow-hidden rounded-l-md select-none">
                    <div className="border-calendar-divider from-calendar-accent to-calendar-accent-hover flex h-5.5 items-center justify-center border-b bg-linear-to-b">
                      <span className="text-calendar-surface text-[10px] font-medium tracking-[0.15em]">
                        {dateInfo.dayOfWeek}
                      </span>
                    </div>
                    <div className="from-calendar-surface to-calendar-surface-muted relative flex flex-1 items-center justify-center bg-linear-to-b from-50% to-50%">
                      <div className="bg-calendar-divider absolute top-1/2 left-0 h-px w-full -translate-y-1/2" />
                      <span className="text-calendar-ink z-10 mt-1 text-3xl leading-none font-black tracking-tighter">
                        {dateInfo.dateNum}
                      </span>
                    </div>
                  </div>
                  <span className="text-content ml-4 truncate text-sm font-bold">
                    {t("home.dailyRecommendations")}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      smartRouter.push("/playlist/?isDailyRecommend=true");
                    }}
                    className="bg-brand text-brand-foreground shadow-brand hover:bg-brand-hover absolute right-4 z-20 flex size-10 translate-y-2 items-center justify-center rounded-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105"
                  >
                    <Play className="ml-1 size-5 fill-current" />
                  </button>
                </div>

                {bannerPlaylist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => smartRouter.push(`/playlist/?id=${item.id}&isRecommend=true`)}
                    className="bg-content/10 hover:bg-content/20 group relative flex h-16 cursor-pointer items-center overflow-hidden rounded-md pr-4 transition-colors"
                  >
                    <Image
                      width={64}
                      height={64}
                      src={item.picUrl}
                      alt={t("playlist.form.coverAlt")}
                      className="shadow-calendar z-10 size-16 object-cover"
                    />
                    <span className="text-content ml-4 truncate text-sm font-bold">
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => handlePlayPlaylist(item.id, event)}
                      disabled={loadingPlayId === `playlist-${item.id}`}
                      className="bg-brand text-brand-foreground shadow-brand hover:bg-brand-hover absolute right-4 z-20 flex size-10 translate-y-2 items-center justify-center rounded-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105"
                    >
                      {loadingPlayId === `playlist-${item.id}` ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Play className="ml-1 size-5 fill-current" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </section>

          <FeaturedActivitiesCarousel />

          <RecommendedVoiceLists voices={recommendedVoiceLists} />

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

          <section>
            <CollapsibleSection
              title={
                <h2 className="text-content text-2xl font-bold tracking-tight hover:underline">
                  {t("home.madeFor", { name: userName ?? t("home.you") })}
                </h2>
              }
              collapsedHeight="280px"
            >
              <div className="grid grid-cols-3 gap-6 md:grid-cols-4 lg:grid-cols-5">
                {playlists.map((playlist) => (
                  <GridCard
                    key={playlist.id}
                    id={playlist.id}
                    name={playlist.name}
                    coverUrl={`${playlist.picUrl}?param=300y300`}
                    subtitle={t("home.playlistSummary", {
                      plays: formatPlayCount(playlist.playCount),
                      count: playlist.trackCount,
                    })}
                    playCount={playlist.playCount}
                    isLoading={loadingPlayId === `playlist-${playlist.id}`}
                    onPlay={(event) => handlePlayPlaylist(playlist.id, event)}
                    onClick={() =>
                      smartRouter.push(`/playlist/?id=${playlist.id}&isRecommend=true`)
                    }
                  />
                ))}
              </div>
            </CollapsibleSection>
          </section>

          {suggestedArtists.length > 0 && (
            <section>
              <CollapsibleSection
                title={
                  <h2 className="text-content text-2xl font-bold tracking-tight hover:underline">
                    {t("home.suggestedArtists")}
                  </h2>
                }
                collapsedHeight="260px"
              >
                <div className="grid grid-cols-3 gap-6 md:grid-cols-4 lg:grid-cols-5">
                  {suggestedArtists.map((artist) => (
                    <GridCard
                      key={artist.id}
                      id={artist.id}
                      name={artist.name}
                      coverUrl={`${artist.picUrl}?param=200y200`}
                      isArtist
                      onClick={() => smartRouter.push(`/artist?id=${artist.id}`)}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
