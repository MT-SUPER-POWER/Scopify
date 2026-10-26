"use client";

import { NowPlayingCard } from "./NowPlayingCard";
import { MvListItem } from "@/components/mv/MvListItem";
import { useArtistMVsQuery, useMVDetailQuery } from "@/hooks/mv/useMVQueries";
import { useSongMvId } from "@/hooks/song/useSongMvId";
import { useNowPlayingMv } from "@/hooks/ui/useNowPlayingMv";
import { useI18n } from "@/store/module/i18n";
import type { MvSummary } from "@/types/api/mv";
import type { NowPlayingSectionProps } from "@/types/components/nowPlaying";

const MV_LIMIT = 4;
const ARTIST_MV_PARAMS = { limit: MV_LIMIT + 1 };

/** 「MV」：本曲 MV 置顶，其后是主艺人的其他 MV；点击后在面板顶部的封面位播放。 */
export function NowPlayingMvs({ song }: NowPlayingSectionProps) {
  const { t } = useI18n();
  const songMvId = useSongMvId(song);
  const artistId = song.ar?.[0]?.id;
  const artistMvs = useArtistMVsQuery(artistId || null, ARTIST_MV_PARAMS).data?.mvs ?? [];
  const songMvInList = artistMvs.some((item) => item.id === songMvId);
  // 本曲 MV 不在艺人列表前几条时，单独取详情补到最前
  const songMvDetail = useMVDetailQuery(songMvId || null, {
    enabled: songMvId > 0 && !songMvInList,
  }).data?.data;
  const mv = useNowPlayingMv(song.id);

  const songMv: MvSummary | undefined = songMvInList
    ? artistMvs.find((item) => item.id === songMvId)
    : songMvDetail;
  const items = [
    ...(songMv ? [songMv] : []),
    ...artistMvs.filter((item) => item.id !== songMvId),
  ].slice(0, MV_LIMIT);

  if (items.length === 0) return null;

  const select = (mvId: number) => {
    mv.open(mvId);
    // 播放器在面板顶部，滚回去让用户看到画面
    document
      .querySelector("[data-now-playing-media]")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <NowPlayingCard title={t("nowPlaying.mvs")} className="pb-2">
      <ul className="mt-2 flex flex-col px-2">
        {items.map((item) => (
          <li key={item.id}>
            <MvListItem
              mv={item}
              isActive={item.id === mv.activeMvId}
              onSelect={select}
              badge={
                item.id === songMvId ? (
                  <span className="shrink-0 rounded-sm bg-content/10 px-1 text-[10px] leading-4 font-bold text-content">
                    {t("nowPlaying.songMv")}
                  </span>
                ) : undefined
              }
            />
          </li>
        ))}
      </ul>
    </NowPlayingCard>
  );
}
