"use client";

import { ChevronUp, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import TracklistTable from "@/components/Playlist/TrackTable";
import { PublicPlaylistGrid } from "@/components/profile/PublicPlaylistGrid";
import { UserActionBar } from "@/components/profile/UserActionBar";
import { UserHero } from "@/components/profile/UserHero";
import { useUserData } from "@/hooks/profile/useUserData";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

export default function UserProfilePage() {
  const { t } = useI18n();
  const uid = useSearchParams().get("userId");
  const router = useSmartRouter();
  const [playlistsOpen, setPlaylistsOpen] = useState(true);

  const { userInfo, playlists, recentSongs, recentPlaylists, themeColor, isLoading, isSelf } =
    useUserData(uid);

  if (!uid) return <div className="p-8 text-white h-full bg-[#121212]">{t("profile.page.invalidUserId")}</div>;

  if (isLoading || !userInfo)
    return (
      <div className="h-full bg-[#121212] flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#1DB954]" />
      </div>
    );

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[#121212] font-sans text-white pb-24">
      <div
        className="absolute top-0 left-0 right-0 h-100 md:h-125 z-0 pointer-events-none opacity-60"
        style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }}
      />

      <UserHero userInfo={userInfo} playlistCount={playlists.length} />

      <div className="flex-1 relative z-10 flex flex-col bg-linear-to-b from-black/20 via-[#121212] to-[#121212] via-20%">
        <UserActionBar isSelf={isSelf} />

        {/* 自己专属：最近播放歌曲 */}
        {isSelf && (
          <div className="px-6 mt-4">
            <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">{t("profile.page.recentSongs")}</h2>
            {recentSongs.length > 0 ? (
              <TracklistTable
                tracks={recentSongs}
                disableVirtualization={true}
                hideDateColumn={true}
                readonly={true}
              />
            ) : (
              <div className="text-gray-400 text-sm py-4">{t("profile.page.noRecentSongs")}</div>
            )}
          </div>
        )}

        {/* 自己专属：最近播放歌单 */}
        {isSelf && (
          <div className="px-6 mt-10">
            <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">
              {t("profile.page.recentPlaylists")}
            </h2>
            {recentPlaylists.length > 0 ? (
              <PublicPlaylistGrid
                playlists={recentPlaylists}
                onClickPlaylist={(id) => router.push(`/playlist?id=${id}`)}
              />
            ) : (
              <div className="text-gray-400 text-sm">{t("profile.page.noRecentPlaylists")}</div>
            )}
          </div>
        )}

        {/* 公开歌单（折叠） */}
        <div className="px-6 mt-10 mb-20">
          <button
            onClick={() => setPlaylistsOpen((v) => !v)}
            className="flex items-center gap-2 mb-6 group"
          >
            <h2 className="text-2xl font-bold group-hover:underline">{t("profile.page.publicPlaylists")}</h2>
            <ChevronUp
              className={cn(
                "w-5 h-5 text-zinc-400 transition-transform duration-200",
                playlistsOpen && "rotate-180",
              )}
            />
          </button>

          {playlistsOpen && (
            <PublicPlaylistGrid
              playlists={playlists}
              onClickPlaylist={(id) => router.push(`/playlist?id=${id}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
