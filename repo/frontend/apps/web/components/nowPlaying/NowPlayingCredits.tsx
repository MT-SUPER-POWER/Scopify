"use client";

import Image from "next/image";
import Link from "next/link";
import { NowPlayingCard } from "./NowPlayingCard";
import { NowPlayingCreditRow } from "./NowPlayingCreditRow";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { useI18n } from "@/store/module/i18n";
import type { NowPlayingSectionProps } from "@/types/player/nowPlayingComponents";

/** 「演职人员」：每位艺人可单独关注，末尾附所属专辑与发行时间。 */
export function NowPlayingCredits({ song }: NowPlayingSectionProps) {
  const { t, locale } = useI18n();
  const artists = (song.ar ?? []).filter((artist) => artist.id);
  const hasAlbum = Boolean(song.al?.id && song.al.name);
  const albumCover = resolveCoverUrl(song.al?.picUrl, song.al?.coverUrl);
  const releaseDate =
    song.publishTime > 0
      ? new Date(song.publishTime).toLocaleDateString(locale, { dateStyle: "long" })
      : null;

  if (artists.length === 0 && !hasAlbum) return null;

  return (
    <NowPlayingCard title={t("nowPlaying.credits")} className="pb-4">
      {artists.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3">
          {artists.map((artist, index) => (
            <NowPlayingCreditRow
              key={artist.id}
              artist={artist}
              role={t(index === 0 ? "nowPlaying.mainArtist" : "nowPlaying.featuredArtist")}
            />
          ))}
        </ul>
      )}
      {hasAlbum && (
        <Link
          href={`/album?id=${song.al.id}`}
          scroll={false}
          className="group mx-2 mt-3 flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-content/5"
        >
          <span className="relative size-10 shrink-0 overflow-hidden rounded bg-surface-elevated">
            {albumCover && (
              <Image
                fill
                sizes="40px"
                src={getSizedImageUrl(albumCover, 100)}
                alt=""
                className="object-cover"
              />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-content group-hover:underline">
              {song.al.name}
            </span>
            <span className="mt-0.5 block truncate text-xs text-content-muted">
              {releaseDate ? `${t("nowPlaying.album")} · ${releaseDate}` : t("nowPlaying.album")}
            </span>
          </span>
        </Link>
      )}
    </NowPlayingCard>
  );
}
