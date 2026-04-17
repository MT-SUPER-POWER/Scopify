import type { SongDetail } from "@/types/api/music";
import { useI18n } from "@/store/module/i18n";
import type { ArtistInfo } from "@/types/artist";
import { PopularTrackItem } from "./PopularTrackItem";

interface Props {
  tracks: SongDetail[];
  queue: SongDetail[];
  artist: ArtistInfo;
}

export function PopularTracks({ tracks, queue, artist }: Props) {
  const { t } = useI18n();
  // DEBUG: 歌手热门歌曲队列
  // console.log("Popular Track:", tracks);

  return (
    <div className="flex-1">
      <h2 className="text-2xl font-bold mb-4">{t("artist.popular.title")}</h2>
      {tracks.length > 0 ? (
        <div className="flex flex-col">
          {tracks.map((track, i) => (
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
        <div className="text-zinc-500 text-sm py-4">{t("artist.popular.noTracks")}</div>
      )}
    </div>
  );
}
