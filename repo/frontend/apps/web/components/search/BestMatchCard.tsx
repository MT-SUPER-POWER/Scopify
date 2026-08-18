"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { SearchBestMatch, Song } from "@/types/search";

interface Props {
  bestMatch: SearchBestMatch | null;
  onNavigate: (path: string) => void;
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
    fee: song.fee ?? 0,
    ar: song.artists.map((a) => ({ id: a.id, name: a.name })),
    al: { id: song.album.id, name: song.album.name, picUrl },
    publishTime: song.album.publishTime || 0,
  };
}

export function BestMatchCard({ bestMatch, onNavigate, songs }: Props) {
  const { t } = useI18n();
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const song = bestMatch?.kind === "song" ? bestMatch.song : null;
  const isActive = !!song && currentSongDetail?.id === song.id;
  const imageSrc =
    bestMatch?.kind === "album"
      ? bestMatch.album.picUrl || bestMatch.album.blurPicUrl || FALLBACK_IMG
      : bestMatch?.kind === "artist"
        ? bestMatch.artist.picUrl || bestMatch.artist.img1v1Url || FALLBACK_IMG
        : bestMatch?.kind === "playlist"
          ? bestMatch.playlist.coverImgUrl || FALLBACK_IMG
          : song?.album.picUrl || song?.artists[0]?.picUrl || FALLBACK_IMG;
  const title =
    bestMatch?.kind === "album"
      ? bestMatch.album.name
      : bestMatch?.kind === "artist"
        ? bestMatch.artist.name
        : bestMatch?.kind === "playlist"
          ? bestMatch.playlist.name
          : (song?.name ?? "");
  const typeLabel =
    bestMatch?.kind === "album"
      ? t("search.section.albums")
      : bestMatch?.kind === "artist"
        ? t("search.section.artists")
        : bestMatch?.kind === "playlist"
          ? t("search.section.playlists")
          : t("search.section.songs");

  const handlePrimaryAction = useCallback(() => {
    if (!bestMatch) return;

    if (bestMatch.kind === "song") {
      if (isActive) {
        setIsPlaying(!isPlaying);
        return;
      }

      const queue = [bestMatch.song, ...songs.filter((item) => item.id !== bestMatch.song.id)];
      setQueue(queue.map(toDetail), 0);
      playTrack(toDetail(bestMatch.song));
      return;
    }

    const path =
      bestMatch.kind === "artist"
        ? `/artist?id=${bestMatch.artist.id}`
        : bestMatch.kind === "album"
          ? `/album?id=${bestMatch.album.id}`
          : `/playlist?id=${bestMatch.playlist.id}`;
    onNavigate(path);
  }, [bestMatch, isActive, isPlaying, onNavigate, playTrack, setIsPlaying, setQueue, songs]);

  return (
    <div className="flex size-full flex-col">
      <h2 className="mb-4 text-2xl font-bold tracking-tight">{t("search.section.bestMatch")}</h2>
      {bestMatch ? (
        <div
          className="group relative flex min-h-55 flex-1 cursor-pointer flex-col justify-end rounded-xl bg-surface-elevated p-6 transition-colors hover:bg-surface-overlay"
          onClick={handlePrimaryAction}
        >
          <div className="mb-5 size-24 overflow-hidden rounded-md bg-surface-sunken shadow-floating">
            <Image
              width={96}
              height={96}
              src={imageSrc}
              alt={title}
              className="size-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
              }}
            />
          </div>
          <div className="mb-1 flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 truncate text-3xl font-bold">{title}</h3>
            {song && <SongVipBadge fee={song.fee} />}
          </div>
          <div className="flex items-center gap-2 text-sm text-content-muted">
            {song &&
              (song.artists.length > 0 ? (
                <ArtistInlineLinks
                  artists={song.artists.map((a) => ({ id: a.id, name: a.name }))}
                  className="font-medium text-content"
                />
              ) : (
                <span className="font-medium text-content hover:underline">
                  {t("search.song.unknownArtist")}
                </span>
              ))}
            {bestMatch.kind === "album" && (
              <ArtistInlineLinks
                artists={[{ id: bestMatch.album.artist.id, name: bestMatch.album.artist.name }]}
                className="font-medium text-content"
              />
            )}
            {bestMatch.kind === "artist" && bestMatch.artist.alias?.length ? (
              <span className="truncate font-medium text-content">
                {bestMatch.artist.alias.join(" · ")}
              </span>
            ) : null}
            {bestMatch.kind === "playlist" && bestMatch.playlist.creator?.nickname ? (
              <span className="truncate font-medium text-content">
                {bestMatch.playlist.creator.nickname}
              </span>
            ) : null}
            <span className="rounded-full bg-overlay/60 px-2 py-0.5 text-[11px] font-bold tracking-wide text-overlay-foreground uppercase">
              {typeLabel}
            </span>
          </div>
          {song && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrimaryAction();
              }}
              className="absolute right-6 bottom-6 flex size-14 translate-y-3 items-center justify-center rounded-full bg-brand text-brand-foreground opacity-0 shadow-brand transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-brand-hover"
            >
              {isActive && isPlaying ? (
                <Pause className="size-7 fill-current" />
              ) : (
                <Play className="ml-1 size-7 fill-current" />
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl bg-surface-elevated p-5 text-sm text-content-subtle">
          {t("search.section.noMatchingResults")}
        </div>
      )}
    </div>
  );
}
