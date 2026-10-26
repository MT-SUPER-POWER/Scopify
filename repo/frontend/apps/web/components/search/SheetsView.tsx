"use client";

import { FileMusic, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { QueryFailure } from "@/components/shared/QueryFailure";
import { QueryPending } from "@/components/shared/QueryPending";
import { QuietState } from "@/components/shared/QuietState";
import { SongResourcesDialog } from "@/components/songResources/SongResourcesDialog";
import { useInfiniteSongSearchQuery } from "@/hooks/search/useSearchQueries";
import { mapSheetSearchSong } from "@/lib/search/sheetSongAdapter";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { SheetsViewProps } from "@/types/components/search";
import { SheetSongResultCard } from "./SheetSongResultCard";
import { SearchCategoryHeader } from "./SearchCategoryHeader";

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
  const [selected, setSelected] = useState<SongDetail | null>(null);
  if (!keyword) return <QuietState compact icon={FileMusic} title={t("songResources.noSongs")} />;
  if (query.data === undefined) return <QueryPending isPaused={query.fetchStatus === "paused"} />;
  const songs = Array.from(
    new Map(
      query.data.pages
        .flatMap((page) => {
          if (!Array.isArray(page.data?.resources))
            throw new Error("Invalid sheet song search response");
          return page.data.resources.map((resource) =>
            mapSheetSearchSong(
              resource,
              t("common.meta.unknownSong"),
              t("common.meta.unknownAlbum"),
            ),
          );
        })
        .map((song) => [song.id, song]),
    ).values(),
  );
  if (songs.length === 0)
    return <QuietState compact icon={FileMusic} title={t("songResources.noSongs")} />;
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4">
        {songs.map((song) => (
          <SheetSongResultCard key={song.id} song={song} onSelect={setSelected} />
        ))}
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
      {query.hasNextPage ? (
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            disabled={query.isFetching}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetching ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {t("songResources.loadMore")}
          </Button>
        </div>
      ) : null}
      {selected ? (
        <SongResourcesDialog
          song={selected}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      ) : null}
    </>
  );
}
