"use client";

import Link from "next/link";
import { NowPlayingCard } from "./NowPlayingCard";
import { useI18n } from "@/store/module/i18n";
import type { NowPlayingSectionProps } from "@/types/components/nowPlaying";

const ROW = "flex flex-col gap-0.5 px-4";
const LABEL = "text-xs text-content-subtle";
const LINK = "truncate text-sm font-medium text-content hover:underline";

/** 「歌曲信息」：所属专辑、全部艺人与发行时间。 */
export function NowPlayingSongInfo({ song }: NowPlayingSectionProps) {
  const { t, locale } = useI18n();
  const hasAlbum = Boolean(song.al?.id && song.al.name);
  const releaseDate =
    song.publishTime > 0
      ? new Date(song.publishTime).toLocaleDateString(locale, { dateStyle: "long" })
      : null;

  return (
    <NowPlayingCard title={t("nowPlaying.songInfo")} className="flex flex-col gap-3 pb-4">
      {hasAlbum && (
        <div className={ROW}>
          <span className={LABEL}>{t("nowPlaying.album")}</span>
          <Link href={`/album?id=${song.al.id}`} scroll={false} className={LINK}>
            {song.al.name}
          </Link>
        </div>
      )}
      {song.ar?.length > 0 && (
        <div className={ROW}>
          <span className={LABEL}>{t("nowPlaying.artists")}</span>
          <div className="flex flex-col gap-1">
            {song.ar.map((artist) =>
              artist.id ? (
                <Link
                  key={artist.id}
                  href={`/artist?id=${artist.id}`}
                  scroll={false}
                  className={LINK}
                >
                  {artist.name}
                </Link>
              ) : (
                <span key={artist.name} className="truncate text-sm font-medium text-content">
                  {artist.name}
                </span>
              ),
            )}
          </div>
        </div>
      )}
      {releaseDate && (
        <div className={ROW}>
          <span className={LABEL}>{t("nowPlaying.releaseDate")}</span>
          <span className="text-sm font-medium text-content">{releaseDate}</span>
        </div>
      )}
    </NowPlayingCard>
  );
}
