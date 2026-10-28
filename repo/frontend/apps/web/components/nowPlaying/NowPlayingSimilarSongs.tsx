"use client";

import { NowPlayingCard } from "./NowPlayingCard";
import { NowPlayingSimilarRow } from "./NowPlayingSimilarRow";
import { useSimilarSongs } from "@/hooks/song/useSimilarSongs";
import { useI18n } from "@/store/module/i18n";
import type { NowPlayingSectionProps } from "@/types/player/nowPlayingComponents";

const SIMILAR_SONG_LIMIT = 5;

/** 「相似歌曲」：与当前歌曲相似的前几首，接着听不用离开面板。 */
export function NowPlayingSimilarSongs({ song }: NowPlayingSectionProps) {
  const { t } = useI18n();
  const query = useSimilarSongs(song.id, true);
  const songs = (query.data ?? []).slice(0, SIMILAR_SONG_LIMIT);

  if (songs.length === 0) return null;

  return (
    <NowPlayingCard title={t("nowPlaying.similarSongs")} className="pb-2">
      <ul className="mt-2 flex flex-col">
        {songs.map((item) => (
          <li key={item.id}>
            <NowPlayingSimilarRow song={item} songs={songs} />
          </li>
        ))}
      </ul>
    </NowPlayingCard>
  );
}
