"use client";

import { useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import TracklistTable from "@/components/Playlist/TrackTable";
import { cn } from "@/lib/utils";

import { useUserData } from "./_hooks/Useuserdata";
import { UserHero } from "./_components/Userhero";
import { PublicPlaylistGrid } from './_components/Publicplaylistgrid';
import { UserActionBar } from './_components/Useractionbar';


export default function UserProfilePage() {
  const uid = useSearchParams().get("userId");
  const router = useSmartRouter();
  const [playlistsOpen, setPlaylistsOpen] = useState(false);

  const {
    userInfo, playlists,
    recentSongs, recentPlaylists,
    themeColor, isLoading, isSelf,
  } = useUserData(uid);

  if (!uid)
    return <div className="p-8 text-white h-screen bg-[#121212]">Invalid User ID</div>;

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
            <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">Recent Songs</h2>
            {recentSongs.length > 0 ? (
              <TracklistTable
                tracks={recentSongs}
                disableVirtualization={true}
                hideDateColumn={true}
                readonly={true}
              />
            ) : (
              <div className="text-gray-400 text-sm py-4">No playback history available</div>
            )}
          </div>
        )}

        {/* 自己专属：最近播放歌单 */}
        {isSelf && (
          <div className="px-6 mt-10">
            <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">Recent Playlists</h2>
            {recentPlaylists.length > 0 ? (
              <PublicPlaylistGrid
                playlists={recentPlaylists}
                onClickPlaylist={(id) => router.push(`/playlist?id=${id}`)}
              />
            ) : (
              <div className="text-gray-400 text-sm">No playlist records available</div>
            )}
          </div>
        )}

        {/* 公开歌单（折叠） */}
        <div className="px-6 mt-10 mb-20">
          <button
            onClick={() => setPlaylistsOpen((v) => !v)}
            className="flex items-center gap-2 mb-6 group"
          >
            <h2 className="text-2xl font-bold group-hover:underline">Public Playlists</h2>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-zinc-400 transition-transform duration-200",
                playlistsOpen && "rotate-180"
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
