"use client";

import { LoaderCircle, Quote } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { songToSongDetail } from "@/lib/search/lyricSearch";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { LyricsViewProps } from "@/types/search/components";
import { LyricCard } from "./LyricCard";
import { SearchCategoryHeader } from "./SearchCategoryHeader";

export function LyricsView({
  hasNextPage,
  isFetchingNextPage,
  items,
  keyword,
  onLoadMore,
}: LyricsViewProps) {
  const { t } = useI18n();
  const currentSongId = usePlayerStore((s) => s.currentSongDetail?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const loadMoreRef = useInfiniteScrollTrigger({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: onLoadMore,
  });

  const allSongDetails = useMemo(() => items.map((item) => songToSongDetail(item.song)), [items]);

  const handlePlaySong = useCallback(
    (targetSong: SongDetail) => {
      const player = usePlayerStore.getState();
      if (player.currentSongDetail?.id === targetSong.id) {
        void player.togglePlaying();
      } else {
        void player.playFromSong(targetSong, allSongDetails, "search-lyrics");
      }
    },
    [allSongDetails],
  );

  return (
    <div className="pb-10">
      <SearchCategoryHeader category="Lyrics" />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-content-muted">
          <Quote className="stroke-1.5 mb-3 size-10 text-content-subtle" />
          <p className="text-sm">{t("search.section.noLyricResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4">
          {items.map((item) => (
            <LyricCard
              key={`${item.song.id}-${item.highlightText || ""}`}
              item={item}
              highlightKeyword={keyword}
              currentSongId={currentSongId}
              isPlaying={isPlaying}
              onPlay={handlePlaySong}
            />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {isFetchingNextPage ? (
        <div className="flex justify-center py-6 text-content-muted" aria-live="polite">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
