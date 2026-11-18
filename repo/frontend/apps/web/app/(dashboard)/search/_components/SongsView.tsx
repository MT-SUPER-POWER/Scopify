import { LoaderCircle } from "lucide-react";
import TracklistTable from "@/components/Playlist/TrackTable";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import type { SongsViewProps } from "@/types/search/components";
import { SearchCategoryHeader } from "./SearchCategoryHeader";

export function SongsView({ hasNextPage, isFetchingNextPage, onLoadMore, songs }: SongsViewProps) {
  const loadMoreRef = useInfiniteScrollTrigger({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: onLoadMore,
  });

  return (
    <div className="pb-10">
      <SearchCategoryHeader category="Songs" />
      <TracklistTable disableVirtualization hideDateColumn tracks={songs} />
      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {isFetchingNextPage ? (
        <div className="flex justify-center py-6 text-content-muted" aria-live="polite">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
