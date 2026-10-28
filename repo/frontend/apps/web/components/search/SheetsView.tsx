"use client";

import { FileMusic, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { QueryFailure } from "@/components/shared/QueryFailure";
import { QueryPending } from "@/components/shared/QueryPending";
import { QuietState } from "@/components/shared/QuietState";
import { SheetPreviewDialog } from "@/components/songResources/SheetPreviewDialog";
import { SongResourcesDialog } from "@/components/songResources/SongResourcesDialog";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { useInfiniteSongSearchQuery } from "@/hooks/search/useSearchQueries";
import { useSongSheetsQueries } from "@/hooks/song/useSongResources";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { mapSheetSearchSong } from "@/lib/search/sheetSongAdapter";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/song/api";
import type { MusicSheet } from "@/types/api/songResources";
import type { SheetsViewProps } from "@/types/search/components";
import { SearchCategoryHeader } from "./SearchCategoryHeader";
import { SheetSongFailureCard } from "./SheetSongFailureCard";
import { SheetSongResultCard } from "./SheetSongResultCard";
import { SheetSongSkeletonCard } from "./SheetSongSkeletonCard";

/** 连续多页都没有可用乐谱时暂停自动扫描，避免冷门关键词无休止地请求。 */
const MAX_EMPTY_TAIL_PAGES = 3;

function countEmptyTailPages(
  pageSongs: SongDetail[][],
  sheetQueryById: Map<number, { data?: MusicSheet[] } | undefined>,
) {
  let count = 0;
  for (let index = pageSongs.length - 1; index >= 0; index -= 1) {
    const hasSheets = pageSongs[index].some(
      (song) => (sheetQueryById.get(song.id)?.data?.length ?? 1) > 0,
    );
    if (hasSheets) break;
    count += 1;
  }
  return count;
}

export function SheetsView({ keyword }: SheetsViewProps) {
  const { t } = useI18n();
  return (
    <div className="pb-10">
      <SearchCategoryHeader category="Sheets" />
      <p className="mb-5 text-sm text-content-muted">{t("songResources.searchHint")}</p>
      <QueryBoundary resetKey={`sheet-search:${keyword.trim()}`}>
        <SheetSearchResults key={keyword.trim()} keyword={keyword.trim()} />
      </QueryBoundary>
    </div>
  );
}

function SheetSearchResults({ keyword }: SheetsViewProps) {
  const { t } = useI18n();
  const query = useInfiniteSongSearchQuery(keyword, 12, true, true);
  const requireLogin = useRequireLoginAction();
  const [selectedSong, setSelectedSong] = useState<SongDetail | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<MusicSheet | null>(null);

  const pages = query.data?.pages;
  const pageSongs = useMemo(
    () =>
      (pages ?? []).map((page) => {
        if (!Array.isArray(page.data?.resources))
          throw new Error("Invalid sheet song search response");
        return page.data.resources.map((resource) =>
          mapSheetSearchSong(resource, t("common.meta.unknownSong"), t("common.meta.unknownAlbum")),
        );
      }),
    [pages, t],
  );
  const songs = useMemo(
    () => Array.from(new Map(pageSongs.flat().map((song) => [song.id, song])).values()),
    [pageSongs],
  );
  const sheetQueries = useSongSheetsQueries(songs.map((song) => song.id));
  const sheetQueryById = new Map(songs.map((song, index) => [song.id, sheetQueries[index]]));
  const isSheetsPending = sheetQueries.some(
    (sheetQuery) => sheetQuery.data === undefined && !sheetQuery.isError,
  );
  const emptyTailPages = countEmptyTailPages(pageSongs, sheetQueryById);
  const isScanPaused = emptyTailPages >= MAX_EMPTY_TAIL_PAGES;

  const loadMoreRef = useInfiniteScrollTrigger({
    enabled:
      query.hasNextPage &&
      !query.isFetchingNextPage &&
      !query.isError &&
      !isSheetsPending &&
      !isScanPaused,
    onIntersect: () => void query.fetchNextPage(),
  });

  if (!keyword) return <QuietState compact icon={FileMusic} title={t("songResources.noSongs")} />;
  if (query.data === undefined) return <QueryPending isPaused={query.fetchStatus === "paused"} />;

  const cards = songs.flatMap((song) => {
    const sheetQuery = sheetQueryById.get(song.id);
    if (!sheetQuery) return [];
    if (sheetQuery.data === undefined) {
      if (sheetQuery.isError)
        return [
          <SheetSongFailureCard
            key={song.id}
            song={song}
            error={sheetQuery.error}
            onRetry={() => void sheetQuery.refetch()}
          />,
        ];
      return [<SheetSongSkeletonCard key={song.id} />];
    }
    if (sheetQuery.data.length === 0) return [];
    return [
      <SheetSongResultCard
        key={song.id}
        song={song}
        sheets={sheetQuery.data}
        onSelectSong={setSelectedSong}
        onSelectSheet={(sheet) => void requireLogin(() => setSelectedSheet(sheet))}
      />,
    ];
  });

  if (cards.length === 0 && !query.hasNextPage)
    return <QuietState compact icon={FileMusic} title={t("songResources.noSongs")} />;
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] gap-4">
        {cards}
      </div>
      {query.isError ? (
        <div className="mt-5">
          <QueryFailure
            compact
            error={query.error}
            onRetry={() =>
              void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())
            }
          />
        </div>
      ) : null}
      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {isScanPaused && query.hasNextPage && !isSheetsPending && !query.isFetchingNextPage ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => void query.fetchNextPage()}>
            {t("songResources.keepSearching")}
          </Button>
        </div>
      ) : null}
      {query.isFetchingNextPage ? (
        <div className="flex justify-center py-6 text-content-muted" aria-live="polite">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : null}
      {selectedSong ? (
        <SongResourcesDialog
          song={selectedSong}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedSong(null);
          }}
        />
      ) : null}
      <SheetPreviewDialog sheet={selectedSheet} onClose={() => setSelectedSheet(null)} />
    </>
  );
}
