"use client";

import { Loader2, Play, RefreshCw } from "lucide-react";
import Image from "next/image";
import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { GridCard } from "@/components/home/GridCard";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { getTimeTheme, useHomeData } from "@/hooks/home/useHomeData";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn, formatPlayCount } from "@/lib/utils";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { NeteaseUserAlbum } from "@/types/api/release";

export default function HomePage() {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const collectedAlbum = useUserStore((s) => s.collectedAlbum);
  const {
    playlists,
    bannerPlaylist,
    suggestedArtists,
    isLoading,
    loadingPlayId,
    hasError,
    dateInfo,
    userName,
    handlePlayPlaylist,
    handlePlayAlbum,
    fetchHomeData,
  } = useHomeData();

  return (
    <div className="relative pb-24 font-sans min-h-screen">
      {/* 背景渐变始终保留 */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 bg-linear-to-b h-full",
          getTimeTheme().gradient,
          "z-0 pointer-events-none",
        )}
      />

      {/* === 核心加载逻辑：如果是首次加载或数据为空时显示骨架屏 === */}
      {isLoading && playlists.length === 0 ? (
        <HomePageSkeleton />
      ) : (
        <div className="relative z-10 p-6 pt-20 space-y-8 animate-in fade-in duration-500">
          {/* 欢迎语 + 快速访问 */}
          <section>
            <CollapsibleSection
              title={
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-white tracking-tight leading-none">
                    {t(getTimeTheme().greetingKey)}
                  </h1>
                  {(hasError || !isLoading) && (
                    <button
                      type="button"
                      onClick={() => fetchHomeData()}
                      disabled={isLoading}
                      className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all disabled:opacity-50"
                      title={t("home.refreshTitle")}
                    >
                      <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                    </button>
                  )}
                </div>
              }
              collapsedHeight="160px"
            >
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div
                  onClick={() => smartRouter.push("/playlist/?isDailyRecommend=true")}
                  className="flex items-center h-16 bg-white/10 hover:bg-white/20 transition-colors rounded-md overflow-hidden group cursor-pointer relative pr-4"
                >
                  <div className="h-16 w-16 shadow-[2px_0_8px_rgba(0,0,0,0.4)] z-10 shrink-0 flex flex-col rounded-l-md overflow-hidden bg-white select-none">
                    <div className="h-5.5 bg-linear-to-b from-[#e34242] to-[#c42b2b] flex items-center justify-center border-b border-black/10">
                      <span className="text-white text-[10px] font-medium tracking-[0.15em]">
                        {dateInfo.dayOfWeek}
                      </span>
                    </div>
                    <div className="flex-1 relative flex items-center justify-center bg-linear-to-b from-momo-light from-50% to-[#f0f0f0] to-50%">
                      <div className="absolute top-1/2 left-0 w-full h-px bg-black/5 shadow-[0_1px_1px_rgba(255,255,255,0.8)] -translate-y-1/2" />
                      <span className="text-3xl font-black text-[#2a2a2a] leading-none z-10 mt-1 tracking-tighter">
                        {dateInfo.dateNum}
                      </span>
                    </div>
                  </div>
                  <span className="text-white font-bold text-sm ml-4 truncate">
                    {t("home.dailyRecommendations")}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      smartRouter.push("/playlist/?isDailyRecommend=true");
                    }}
                    className="absolute right-4 w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-105 hover:bg-[#1fdf64]"
                  >
                    <Play className="w-5 h-5 fill-current ml-1" />
                  </button>
                </div>

                {bannerPlaylist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => smartRouter.push(`/playlist/?id=${item.id}&isRecommend=true`)}
                    className="flex items-center h-16 bg-white/10 hover:bg-white/20 transition-colors rounded-md overflow-hidden group cursor-pointer relative pr-4"
                  >
                    <Image
                      width={64}
                      height={64}
                      src={item.picUrl}
                      alt={t("playlist.form.coverAlt")}
                      className="h-16 w-16 object-cover shadow-[4px_0_10px_rgba(0,0,0,0.3)] z-10"
                    />
                    <span className="text-white font-bold text-sm ml-4 truncate">{item.name}</span>
                    <button
                      type="button"
                      onClick={(e) => handlePlayPlaylist(item.id, e)}
                      disabled={loadingPlayId === `playlist-${item.id}`}
                      className="absolute right-4 w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-105 hover:bg-[#1fdf64] disabled:opacity-80"
                    >
                      {loadingPlayId === `playlist-${item.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-1" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </section>

          {/* 推荐歌单 */}
          <section>
            <CollapsibleSection
              title={
                <h2 className="text-2xl font-bold text-white hover:underline tracking-tight">
                  {t("home.madeFor", { name: userName ?? t("home.you") })}
                </h2>
              }
              collapsedHeight="280px"
            >
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
                  <h2 className="text-2xl font-bold text-white hover:underline tracking-tight">
                    {t("home.suggestedArtists")}
                  </h2>
                }
                collapsedHeight="260px"
              >
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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

          {/* 已收藏专辑 */}
          {collectedAlbum.length > 0 && (
            <section>
              <CollapsibleSection
                title={
                  <h2 className="text-2xl font-bold text-white hover:underline tracking-tight">
                    {t("home.yourCollectedAlbums")}
                  </h2>
                }
                collapsedHeight="280px"
              >
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {collectedAlbum.map((item: NeteaseUserAlbum) => (
                    <GridCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      coverUrl={item.picUrl}
                      isLoading={loadingPlayId === `album-${item.id}`}
                      onPlay={(e) => handlePlayAlbum(item.id, e)}
                      onClick={() => smartRouter.push(`/album?id=${item.id}`)}
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
