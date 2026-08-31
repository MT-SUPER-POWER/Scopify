import Link from "next/link";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { ArtistInfo } from "@/types/artist";
import { PopularTrackItem } from "./PopularTrackItem";

interface Props {
  tracks: SongDetail[];
  queue: SongDetail[];
  artist: ArtistInfo;
}

export function PopularTracks({ tracks, queue, artist }: Props) {
  const { t } = useI18n();
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
          {tracks.length > 10 && (
            <Link
              href={`/artist/songs?id=${artist.id}`}
              className="mt-4 w-fit rounded-full border border-content/10 px-4 py-2 text-sm font-semibold text-content-muted transition hover:border-content/30 hover:text-content"
            >
              {t("common.action.showAll")}
            </Link>
          )}
        </div>
      ) : (
        <div className="py-4 text-sm text-content-subtle">{t("artist.popular.noTracks")}</div>
      )}
    </div>
  );
}
