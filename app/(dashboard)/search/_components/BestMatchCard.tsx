"use client";

import { useCallback } from "react";
import { Play, Pause } from "lucide-react";
import Image from "next/image";

import { usePlayerStore } from "@/store";
import { SongDetail } from "@/types/api/music";
import { Song } from "../_types";

interface Props {
  song: Song | null;
  songs: Song[];
}

const FALLBACK_IMG = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop";

function toDetail(song: Song): SongDetail {
  const picUrl = song.album.picUrl || song.artists[0]?.picUrl || "";
  return {
    id: song.id,
    name: song.name,
    dt: song.duration,
    ar: song.artists.map((a) => ({ id: a.id, name: a.name })),
    al: { id: song.album.id, name: song.album.name, picUrl },
    publishTime: song.album.publishTime || 0,
  };
}

export function BestMatchCard({ song, songs }: Props) {
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const isActive = !!song && currentSongDetail?.id === song.id;

  const handlePlay = useCallback(() => {
    if (!song) return;
    if (isActive) {
      setIsPlaying(!isPlaying);
      return;
    }
    setQueue(songs.map(toDetail), 0);
    playTrack(toDetail(song));
  }, [song, songs, isActive, isPlaying, setIsPlaying, setQueue, playTrack]);

  return (
    <div className="xl:w-[40%] flex flex-col">
      <h2 className="text-2xl font-bold mb-4 tracking-tight">Best Match</h2>
      {song ? (
        <div
          className="relative group bg-[#181818] hover:bg-[#282828] transition-colors rounded-xl p-6 flex-1 cursor-pointer flex flex-col justify-end min-h-55"
          onClick={handlePlay}
        >
          <div className="w-24 h-24 mb-5 shadow-2xl rounded-md overflow-hidden bg-zinc-800">
            <Image
              width={96} height={96}
              src={song.album?.picUrl || song.artists[0]?.picUrl || ""}
              alt={song.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
            />
          </div>
          <h3 className="text-3xl font-bold mb-1 truncate">{song.name}</h3>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="text-white hover:underline font-medium">
              {song.artists?.map((a) => a.name).join(", ") || "未知歌手"}
            </span>
            <span className="px-2 py-0.5 bg-black/50 rounded-full text-[11px] font-bold tracking-wide uppercase">
              Songs
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handlePlay(); }}
            className="absolute bottom-6 right-6 w-14 h-14 bg-[#1ed760] rounded-full flex items-center justify-center text-black opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#3be477] shadow-xl"
          >
            {isActive && isPlaying
              ? <Pause className="w-7 h-7 fill-current" />
              : <Play className="w-7 h-7 fill-current ml-1" />}
          </button>
        </div>
      ) : (
        <div className="bg-[#181818] rounded-xl p-5 flex-1 flex items-center justify-center text-zinc-500 text-sm">
          No matching results
        </div>
      )}
    </div>
  );
}
