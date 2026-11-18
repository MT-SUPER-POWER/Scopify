"use client";

import { NowPlayingCard } from "./NowPlayingCard";
import { MvListItem } from "@/components/mv/MvListItem";
import { useArtistMVsQuery, useMvDetailQuery } from "@/hooks/mv/useMVQueries";
import { adaptNeteaseMv } from "@/lib/providers/netease/adapters/mv";
import { useSongMvId } from "@/hooks/song/useSongMvId";
import { useNowPlayingMv } from "@/hooks/ui/useNowPlayingMv";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { MusicMv } from "@scopify/music-domain/mv";

import type { NowPlayingSectionProps } from "@/types/player/nowPlayingComponents";

const MV_LIMIT = 4;
const ARTIST_MV_PARAMS = { limit: MV_LIMIT + 1 };

/** 「MV」：本曲 MV 置顶，其后是主艺人的其他 MV；点击后在面板顶部的封面位播放。 */
export function NowPlayingMvs({ song }: NowPlayingSectionProps) {
  const { t } = useTranslation();
  const songMvId = useSongMvId(song);
  const artistId = song.ar?.[0]?.id;
  const artistMvsData = useArtistMVsQuery(artistId || null, ARTIST_MV_PARAMS).data?.mvs;
  const artistMvs = useMemo(() => (artistMvsData ?? []).map(adaptNeteaseMv), [artistMvsData]);
  const songMvKey = String(songMvId);
  const songMvInList = artistMvs.some((item) => item.ref.id === songMvKey);
  // 本曲 MV 不在艺人列表前几条时，单独取详情补到最前
  const songMvRef = useMemo(
    () => (songMvId > 0 ? ({ provider: "netease", kind: "mv", id: songMvKey } as const) : null),
    [songMvId, songMvKey],
  );
  const songMvDetail = useMvDetailQuery(songMvRef, {
    enabled: songMvId > 0 && !songMvInList,
  }).data;
  const mv = useNowPlayingMv(song.id);

  const songMv: MusicMv | undefined = songMvInList
    ? artistMvs.find((item) => item.ref.id === songMvKey)
    : songMvDetail;
  const items = [
    ...(songMv ? [songMv] : []),
    ...artistMvs.filter((item) => item.ref.id !== songMvKey),
  ].slice(0, MV_LIMIT);

  if (items.length === 0) return null;

  const select = (mvId: string) => {
    mv.open(Number(mvId));
    // 播放器在面板顶部，滚回去让用户看到画面
    document
      .querySelector("[data-now-playing-media]")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <NowPlayingCard title={t("nowPlaying.mvs")} className="pb-2">
      <ul className="mt-2 flex flex-col px-2">
        {items.map((item) => (
          <li key={item.ref.id}>
            <MvListItem
              mv={item}
              isActive={Number(item.ref.id) === mv.activeMvId}
              onSelect={select}
              badge={
                item.ref.id === songMvKey ? (
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
