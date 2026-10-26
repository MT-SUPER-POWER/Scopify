"use client";

import { NewAlbumsSection } from "@/components/home/NewAlbumsSection";
import { NewSongsSection } from "@/components/home/NewSongsSection";
import { ToplistSection } from "@/components/home/ToplistSection";
import { QueryPending } from "@/components/shared/QueryPending";
import {
  useNewAlbumsQuery,
  useNewSongsQuery,
  useToplistDetailQuery,
} from "@/hooks/home/useHomeQueries";
import { pruneSongDetail } from "@/types/api/music";
import type { ToplistDetailItem } from "@/types/api/toplist";
import type { HomeQueryContentProps } from "@/types/components/home";

export function HomeNewAlbumsContent({ actions }: HomeQueryContentProps) {
  const query = useNewAlbumsQuery();
  if (query.isPending) return <QueryPending isPaused={query.fetchStatus === "paused"} />;
  const albums = (query.data?.albums ?? []).filter((album) => Boolean(album?.id && album.name));
  return (
    <NewAlbumsSection
      albums={albums}
      loadingPlayId={actions.loadingPlayId}
      onPlayAlbum={actions.handlePlayAlbum}
    />
  );
}

export function HomeNewSongsContent({ actions }: HomeQueryContentProps) {
  const query = useNewSongsQuery();
  if (query.isPending) return <QueryPending isPaused={query.fetchStatus === "paused"} />;
  const songs = (query.data?.result ?? [])
    .map((item) => pruneSongDetail(item.song))
    .filter((song) => Boolean(song?.id));
  return (
    <NewSongsSection
      songs={songs}
      onPlaySong={(_song, index) => actions.playSongs(songs, index)}
      onPlayAll={() => actions.playSongs(songs, 0)}
    />
  );
}

export function HomeToplistsContent({ actions }: HomeQueryContentProps) {
  const query = useToplistDetailQuery();
  if (query.isPending) return <QueryPending isPaused={query.fetchStatus === "paused"} />;
  const list = query.data?.list ?? [];
  const ids = [19723756, 3779629, 3778678, 2884035];
  const charts = new Map(list.map((item) => [item.id, item]));
  const official = ids
    .map((id) => charts.get(id))
    .filter((item): item is ToplistDetailItem => Boolean(item?.tracks?.length));
  const remaining = list.filter((item) => !ids.includes(item.id) && item.tracks?.length);
  return (
    <ToplistSection
      toplists={[...official, ...remaining].slice(0, 4)}
      loadingPlayId={actions.loadingPlayId}
      onPlayToplist={actions.handlePlayPlaylist}
    />
  );
}
