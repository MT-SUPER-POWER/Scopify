import { LoaderCircle } from "lucide-react";
import { useMemo } from "react";
import TracklistTable from "@/components/Playlist/TrackTable";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import type { SongDetail } from "@/types/api/music";
import type { SongsViewProps } from "@/types/components/search";
import type { Song } from "@/types/search";
import { SearchCategoryHeader } from "./SearchCategoryHeader";

function songToSongDetail(song: Song): SongDetail {
  const picUrl = song.album?.picUrl || song.artists?.[0]?.picUrl || "";
  return {
    id: song.id,
    name: song.name,
    dt: song.duration,
    fee: song.fee ?? 0,
    ar: (song.artists || []).map((a) => ({ id: a.id, name: a.name })),
    al: { id: song.album?.id ?? 0, name: song.album?.name ?? "", picUrl },
    alia: song.alias,
    publishTime: song.album?.publishTime || 0,
  };
}

export function SongsView({ hasNextPage, isFetchingNextPage, onLoadMore, songs }: SongsViewProps) {
  const loadMoreRef = useInfiniteScrollTrigger({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: onLoadMore,
  });

  const songDetails = useMemo(() => songs.map(songToSongDetail), [songs]);

  return (
    <div className="pb-10">
      <SearchCategoryHeader category="Songs" />
      <TracklistTable disableVirtualization hideDateColumn tracks={songDetails} />
      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {isFetchingNextPage ? (
        <div className="flex justify-center py-6 text-zinc-400" aria-live="polite">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
