import { SongDetail } from "@/types/api/music";
import { Track, ArtistInfo } from "../_types";
import { PopularTrackItem } from "./Populartrackitem";

interface Props {
  tracks: Track[];
  queue: SongDetail[];
  artist: ArtistInfo;
}

export function PopularTracks({ tracks, queue, artist }: Props) {
  return (
    <div className="flex-1">
      <h2 className="text-2xl font-bold mb-4">Popular</h2>
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
        <div className="text-zinc-500 text-sm py-4">暂无热门歌曲</div>
      )}
    </div>
  );
}
