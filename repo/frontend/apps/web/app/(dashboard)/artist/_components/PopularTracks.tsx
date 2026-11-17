import Link from "next/link";
import { useTranslation } from "react-i18next";

import type { PopularTracksProps } from "@/types/artist/components";
import { PopularTrackItem } from "./PopularTrackItem";

export function PopularTracks({ tracks, queue, artist }: PopularTracksProps) {
  const { t } = useTranslation();
  const visibleTracks = tracks.slice(0, 10);
  // DEBUG: 歌手热门歌曲队列
  // console.log("Popular Track:", tracks);

  return (
    <div className="flex-1">
      <h2 className="mb-4 text-2xl font-bold">{t("artist.popular.title")}</h2>
      {tracks.length > 0 ? (
        <div className="flex flex-col">
          {visibleTracks.map((track, i) => (
            <PopularTrackItem
              key={track.id}
              track={track}
              index={i}
              queue={queue}
              artist={artist}
            />
          ))}
        </div>
      ) : (
        <div className="py-4 text-sm text-content-subtle">{t("artist.popular.noTracks")}</div>
      )}
      <Link
        href={`/artist/songs?id=${encodeURIComponent(String(artist.id))}`}
        className="mt-4 inline-block w-fit rounded-full border border-content/10 px-4 py-2 text-sm font-semibold text-content-muted transition hover:border-content/30 hover:text-content"
      >
        {t("artist.songs.title")}
      </Link>
    </div>
  );
}
