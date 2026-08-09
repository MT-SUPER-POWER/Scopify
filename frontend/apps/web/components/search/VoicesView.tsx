import { LoaderCircle } from "lucide-react";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import type { VoicesViewProps } from "@/types/components/search";
import { SearchCategoryHeader } from "./SearchCategoryHeader";
import { VoiceList } from "./VoiceList";

export function VoicesView({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  voices,
}: VoicesViewProps) {
  const loadMoreRef = useInfiniteScrollTrigger({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: onLoadMore,
  });

  return (
    <div className="pb-10">
      <SearchCategoryHeader category="Voices" />
      <VoiceList voices={voices} layout="grid" />
      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {isFetchingNextPage ? (
        <div className="text-content-muted flex justify-center py-6" aria-live="polite">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
