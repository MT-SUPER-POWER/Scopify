import { useI18n } from "@/store/module/i18n";
import type { Song } from "@/types/search";
import { SongItem } from "./SongItem";

interface Props {
  songs: Song[];
  /** 截断显示前 N 首，undefined 表示全部显示 */
  limit?: number;
  onViewAll?: () => void;
}

export function SongsPanel({ songs, limit, onViewAll }: Props) {
  const { t } = useI18n();
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
          <SongItem key={song.id} song={song} index={i} songs={songs} />
        ))}
        {songs.length === 0 && (
          <p className="py-4 text-sm text-content-subtle">{t("search.section.noSongResults")}</p>
        )}
      </div>
    </div>
  );
}
