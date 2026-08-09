import { useState } from "react";
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
  const [expanded, setExpanded] = useState(false);
  const visibleTracks = expanded ? tracks : tracks.slice(0, 10);
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
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="text-content-muted border-content/10 hover:border-content/30 hover:text-content mt-4 w-fit rounded-full border px-4 py-2 text-sm font-semibold transition"
            >
              {expanded ? t("common.action.showLess") : t("common.action.showAll")}
            </button>
          )}
        </div>
      ) : (
        <div className="text-content-subtle py-4 text-sm">{t("artist.popular.noTracks")}</div>
      )}
    </div>
  );
}
