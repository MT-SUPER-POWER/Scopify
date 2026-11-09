"use client";

import { musicResourceKey } from "@scopify/music-domain/identity";
import type { MusicSearchBestMatch } from "@scopify/music-domain/search";
import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { ArtistInlineLinks } from "@/components/shared/ArtistInlineLinks";
import { SongVipBadge } from "@/components/shared/SongVipBadge";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";

import type { PlayerTrack } from "@/types/player/model";

interface Props {
  bestMatch: MusicSearchBestMatch | null;
  onNavigate: (path: string) => void;
  songs: PlayerTrack[];
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop";

export function BestMatchCard({ bestMatch, onNavigate, songs }: Props) {
  const { t } = useTranslation();
  const canOpenArtist = useProviderCapability("artist.read");
  const canOpenAlbum = useProviderCapability("album.read");
  const canOpenPlaylist = useProviderCapability("playlist.read");
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const song: PlayerTrack | null = bestMatch?.kind === "song" ? bestMatch.song : null;
  const isActive =
    !!song && !!currentTrack && musicResourceKey(currentTrack.ref) === musicResourceKey(song.ref);
  const imageSrc =
    bestMatch?.kind === "album"
      ? bestMatch.album.coverUrl || FALLBACK_IMG
      : bestMatch?.kind === "artist"
        ? bestMatch.artist.avatarUrl || FALLBACK_IMG
        : bestMatch?.kind === "playlist"
          ? bestMatch.playlist.coverUrl || FALLBACK_IMG
          : song?.album?.coverUrl || FALLBACK_IMG;
  const title =
    bestMatch?.kind === "album"
      ? bestMatch.album.title
      : bestMatch?.kind === "artist"
        ? bestMatch.artist.name
        : bestMatch?.kind === "playlist"
          ? bestMatch.playlist.title
          : (song?.title ?? "");
  const typeLabel =
    bestMatch?.kind === "album"
      ? t("search.section.albums")
      : bestMatch?.kind === "artist"
        ? t("search.section.artists")
        : bestMatch?.kind === "playlist"
          ? t("search.section.playlists")
          : t("search.section.songs");
  // The page the card opens, or null when the platform has no such page.
  const path =
    bestMatch?.kind === "artist" && canOpenArtist
      ? `/artist?id=${bestMatch.artist.ref.id}`
      : bestMatch?.kind === "album" && canOpenAlbum
        ? `/album?id=${bestMatch.album.ref.id}`
        : bestMatch?.kind === "playlist" && canOpenPlaylist
          ? `/playlist?id=${bestMatch.playlist.ref.id}`
          : null;
  const isClickable = bestMatch?.kind === "song" || path !== null;
  const albumArtist = bestMatch?.kind === "album" ? bestMatch.album.artists[0] : undefined;

  const handlePrimaryAction = useCallback(() => {
    if (!bestMatch) return;

    if (bestMatch.kind === "song") {
      if (isActive) {
        setIsPlaying(!isPlaying);
        return;
      }

      const queue = [
        bestMatch.song,
        ...songs.filter(
          (item) => musicResourceKey(item.ref) !== musicResourceKey(bestMatch.song.ref),
        ),
      ];
      setQueue(queue, 0);
      playTrack(bestMatch.song);
      return;
    }

    if (path) onNavigate(path);
  }, [bestMatch, isActive, isPlaying, onNavigate, path, playTrack, setIsPlaying, setQueue, songs]);

  return (
    <div className="flex size-full flex-col">
      <h2 className="mb-4 text-2xl font-bold tracking-tight">{t("search.section.bestMatch")}</h2>
      {bestMatch ? (
        <div
          className={
            isClickable
              ? "group relative flex min-h-55 flex-1 cursor-pointer flex-col justify-end rounded-xl bg-surface-elevated p-6 transition-colors hover:bg-surface-overlay"
              : "group relative flex min-h-55 flex-1 flex-col justify-end rounded-xl bg-surface-elevated p-6"
          }
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
            {song && <SongVipBadge fee={song.netease?.fee} />}
          </div>
          <div className="flex items-center gap-2 text-sm text-content-muted">
            {song &&
              (song.artists.length > 0 ? (
                <ArtistInlineLinks
                  artists={song.artists.map((artist) => ({
                    id: canOpenArtist ? artist.ref.id : null,
                    name: artist.name,
                  }))}
                  className="font-medium text-content"
                />
              ) : (
                <span className="font-medium text-content hover:underline">
                  {t("search.song.unknownArtist")}
                </span>
              ))}
            {albumArtist && (
              <ArtistInlineLinks
                artists={[
                  {
                    id: canOpenArtist ? (albumArtist.ref?.id ?? null) : null,
                    name: albumArtist.name,
                  },
                ]}
                className="font-medium text-content"
              />
            )}
            {bestMatch.kind === "artist" && bestMatch.artist.aliases.length > 0 ? (
              <span className="truncate font-medium text-content">
                {bestMatch.artist.aliases.join(" · ")}
              </span>
            ) : null}
            {bestMatch.kind === "playlist" && bestMatch.playlist.creator?.name ? (
              <span className="truncate font-medium text-content">
                {bestMatch.playlist.creator.name}
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
