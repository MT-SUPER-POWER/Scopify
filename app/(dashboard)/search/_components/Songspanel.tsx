import { Song } from "../_types"; // Corrected import path
import { SongItem } from "./SongItem";

interface Props {
  songs: Song[];
  /** 截断显示前 N 首，undefined 表示全部显示 */
  limit?: number;
  onViewAll?: () => void;
}

export function SongsPanel({ songs, limit, onViewAll }: Props) {
  const displayed = limit ? songs.slice(0, limit) : songs;

  return (
    <div className="xl:w-[60%] flex flex-col">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Songs</h2>
        {onViewAll && songs.length > (limit ?? 0) && (
          <button onClick={onViewAll} className="text-sm font-bold text-zinc-400 hover:text-white hover:underline">
            View All
          </button>
        )}
      </div>
      <div className="flex flex-col">
        {displayed.map((song, i) => (
          <SongItem key={song.id} song={song} index={i} songs={songs} />
        ))}
        {songs.length === 0 && (
          <p className="text-zinc-500 text-sm py-4">No song results</p>
        )}
      </div>
    </div>
  );
}
