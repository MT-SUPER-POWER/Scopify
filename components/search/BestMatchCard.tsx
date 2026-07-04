"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { Song } from "@/types/search";

interface Props {
  song: Song | null;
  songs: Song[];
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop";

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
  const { t } = useI18n();
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
    <div className="flex flex-col xl:w-[40%]">
      <h2 className="mb-4 text-2xl font-bold tracking-tight">{t("search.section.bestMatch")}</h2>
      {song ? (
        <div
          className="group relative flex min-h-55 flex-1 cursor-pointer flex-col justify-end rounded-xl bg-[#181818] p-6 transition-colors hover:bg-[#282828]"
          onClick={handlePlay}
        >
          <div className="mb-5 h-24 w-24 overflow-hidden rounded-md bg-zinc-800 shadow-2xl">
            <Image
              width={96}
              height={96}
              src={song.album?.picUrl || song.artists[0]?.picUrl || ""}
              alt={song.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
              }}
            />
          </div>
          <h3 className="mb-1 truncate text-3xl font-bold">{song.name}</h3>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            {song.artists && song.artists.length > 0 ? (
              <ArtistInlineLinks
                artists={song.artists.map((a) => ({ id: a.id, name: a.name }))}
                className="font-medium text-white"
              />
            ) : (
              <span className="font-medium text-white hover:underline">
                {t("search.song.unknownArtist")}
              </span>
            )}
            <span className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase">
              {t("search.section.songs")}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className="absolute right-6 bottom-6 flex h-14 w-14 translate-y-3 items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-[#3be477]"
          >
            {isActive && isPlaying ? (
              <Pause className="h-7 w-7 fill-current" />
            ) : (
              <Play className="ml-1 h-7 w-7 fill-current" />
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl bg-[#181818] p-5 text-sm text-zinc-500">
          {t("search.section.noMatchingResults")}
        </div>
      )}
    </div>
  );
}
