import { musicResourceKey } from "@scopify/music-domain/identity";
import { useTranslation } from "react-i18next";

import type { PlayerTrack } from "@/types/player/model";
import { SongItem } from "./SongItem";

interface Props {
  songs: PlayerTrack[];
  /** 截断显示前 N 首，undefined 表示全部显示 */
  limit?: number;
  onViewAll?: () => void;
}

export function SongsPanel({ songs, limit, onViewAll }: Props) {
  const { t } = useTranslation();
  const displayed = limit ? songs.slice(0, limit) : songs;

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("search.section.songs")}</h2>
        {onViewAll && songs.length > (limit ?? 0) && (
          <button
            onClick={onViewAll}
            className="text-sm font-bold text-content-muted hover:text-content hover:underline"
          >
            {t("common.action.viewAll")}
          </button>
        )}
      </div>
      <div className="flex flex-col">
        {displayed.map((song, i) => (
          <SongItem key={musicResourceKey(song.ref)} track={song} index={i} tracks={songs} />
        ))}
        {songs.length === 0 && (
          <p className="py-4 text-sm text-content-subtle">{t("search.section.noSongResults")}</p>
        )}
      </div>
    </div>
  );
}
