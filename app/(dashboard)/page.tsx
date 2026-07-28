"use client";

import { Loader2, Play } from "lucide-react";
import Image from "next/image";
import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { GridCard } from "@/components/home/GridCard";
import { FeaturedActivitiesCarousel } from "@/components/home/FeaturedActivitiesCarousel";
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
  const {
    playlists,
    recommendedVoiceLists,
    bannerPlaylist,
    suggestedArtists,
    isLoading,
    loadingPlayId,
    hasError,
    dateInfo,
    userName,
    handlePlayPlaylist,
    fetchHomeData,
  } = useHomeData();

  return (
    <div className="relative min-h-screen pb-24 font-sans">
      {/* 背景渐变始终保留 */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-full bg-linear-to-b",
          getTimeTheme().gradient,
          "pointer-events-none z-0",
        )}
      />

      {/* === 核心加载逻辑：如果是首次加载或数据为空时显示骨架屏 === */}
      {isLoading && playlists.length === 0 ? (
        <HomePageSkeleton />
      ) : (
        <div className="animate-in fade-in relative z-10 space-y-8 p-6 pt-20 duration-500">
          {/* 欢迎语 + 快速访问 */}
          <section>
            <CollapsibleSection
              title={
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl leading-none font-bold tracking-tight text-white">
                    {t(getTimeTheme().greetingKey)}
                  </h1>
                </div>
              }
              collapsedHeight="160px"
            >
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <div
                  onClick={() => smartRouter.push("/playlist/?isDailyRecommend=true")}
                  className="group relative flex h-16 cursor-pointer items-center overflow-hidden rounded-md bg-white/10 pr-4 transition-colors hover:bg-white/20"
                >
                  <div className="z-10 flex size-16 shrink-0 flex-col overflow-hidden rounded-l-md bg-white shadow-[2px_0_8px_rgba(0,0,0,0.4)] select-none">
                    <div className="flex h-5.5 items-center justify-center border-b border-black/10 bg-linear-to-b from-[#e34242] to-[#c42b2b]">
                      <span className="text-[10px] font-medium tracking-[0.15em] text-white">
                        {dateInfo.dayOfWeek}
                      </span>
                    </div>
                    <div className="from-momo-light relative flex flex-1 items-center justify-center bg-linear-to-b from-50% to-[#f0f0f0] to-50%">
                      <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-black/5 shadow-[0_1px_1px_rgba(255,255,255,0.8)]" />
                      <span className="z-10 mt-1 text-3xl leading-none font-black tracking-tighter text-[#2a2a2a]">
                        {dateInfo.dateNum}
                      </span>
                    </div>
                  </div>
                  <span className="ml-4 truncate text-sm font-bold text-white">
                    {t("home.dailyRecommendations")}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      smartRouter.push("/playlist/?isDailyRecommend=true");
                    }}
                    className="absolute right-4 z-20 flex size-10 translate-y-2 items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-[#1fdf64]"
                  >
                    <Play className="ml-1 size-5 fill-current" />
                  </button>
                </div>

                {bannerPlaylist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => smartRouter.push(`/playlist/?id=${item.id}&isRecommend=true`)}
                    className="group relative flex h-16 cursor-pointer items-center overflow-hidden rounded-md bg-white/10 pr-4 transition-colors hover:bg-white/20"
                  >
                    <Image
                      width={64}
                      height={64}
                      src={item.picUrl}
                      alt={t("playlist.form.coverAlt")}
                      className="z-10 size-16 object-cover shadow-[4px_0_10px_rgba(0,0,0,0.3)]"
                    />
                    <span className="ml-4 truncate text-sm font-bold text-white">{item.name}</span>
                    <button
                      type="button"
                      onClick={(e) => handlePlayPlaylist(item.id, e)}
                      disabled={loadingPlayId === `playlist-${item.id}`}
                      className="absolute right-4 z-20 flex size-10 translate-y-2 items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-[#1fdf64]"
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

          {/* 推荐歌单 */}
          <section>
            <CollapsibleSection
              title={
                <h2 className="text-2xl font-bold tracking-tight text-white hover:underline">
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
                    onPlay={(e) => handlePlayPlaylist(playlist.id, e)}
                    onClick={() =>
                      smartRouter.push(`/playlist/?id=${playlist.id}&isRecommend=true`)
                    }
                  />
                ))}
              </div>
            </CollapsibleSection>
          </section>

          {/* 推荐歌手 */}
          {suggestedArtists.length > 0 && (
            <section>
              <CollapsibleSection
                title={
                  <h2 className="text-2xl font-bold tracking-tight text-white hover:underline">
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
