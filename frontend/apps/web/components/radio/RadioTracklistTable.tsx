"use client";

import { Clock } from "lucide-react";
import { useCallback, useMemo } from "react";

import { RadioProgramRow } from "@/components/radio/RadioProgramRow";
import { TracklistResizeHandle } from "@/components/shared/TracklistResizeHandle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DASHBOARD_HEADER_HEIGHT } from "@/constants/layout";
import { useRadioTracklistColumnLayout } from "@/hooks/radio/useRadioTracklistColumnLayout";
import { useRadioTracklistStickyHeader } from "@/hooks/radio/useRadioTracklistStickyHeader";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useTimeStore } from "@/store/module/time";
import type { RadioTracklistTableProps } from "@/types/components/radio";

export function RadioTracklistTable({
  programs,
  radioId,
  searchQuery,
  tracks,
}: RadioTracklistTableProps) {
  const { t } = useI18n();
  const currentSongDetail = usePlayerStore((state) => state.currentSongDetail);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playlistId = usePlayerStore((state) => state.playlistId);
  const playFromSong = usePlayerStore((state) => state.playFromSong);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const currentTime = useTimeStore((state) => state.currentTime);
  const showMetadataColumns = useMediaQuery("(min-width: 1024px)");
  const columnLayout = useRadioTracklistColumnLayout({
    showPlayCountColumn: showMetadataColumns,
    showUpdatedAtColumn: showMetadataColumns,
  });
  const { isSticky: isTableHeaderSticky, sentinelRef: stickyHeaderSentinelRef } =
    useRadioTracklistStickyHeader(DASHBOARD_HEADER_HEIGHT);
  const playSourceId = `radio:${radioId}`;
  const rows = useMemo(() => {
    const query = searchQuery?.trim().toLocaleLowerCase();

    return programs.flatMap((program) => {
      const track = tracks.find((item) => item.id === program.mainSong.id);
      if (!track) return [];
      if (!query) return [{ program, track }];

      const matches = [program.name, program.description, track.name]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(query));
      return matches ? [{ program, track }] : [];
    });
  }, [programs, searchQuery, tracks]);
  const handlePlay = useCallback(
    (track: (typeof rows)[number]["track"]) => {
      const isCurrent = currentSongDetail?.id === track.id && playlistId === playSourceId;
      if (isCurrent) {
        setIsPlaying(!isPlaying);
        return;
      }

      void playFromSong(track, tracks, playSourceId);
    },
    [currentSongDetail, isPlaying, playFromSong, playSourceId, playlistId, setIsPlaying, tracks],
  );

  return (
    <div className="w-full px-6 md:px-8 lg:px-10 xl:px-12">
      <div ref={stickyHeaderSentinelRef} aria-hidden className="-mb-px h-px" />
      <div ref={columnLayout.containerRef} className="-mx-4">
        <Table
          containerClassName="overflow-visible"
          className="w-full table-fixed text-zinc-400"
          style={{ minWidth: columnLayout.minimumTableWidth }}
        >
          <colgroup>
            {columnLayout.visibleColumns.map((column) => (
              <col key={column} style={columnLayout.getColumnStyle(column)} />
            ))}
          </colgroup>
          <TableHeader
            style={{ top: DASHBOARD_HEADER_HEIGHT }}
            className={cn(
              "sticky z-10 transition-[background-color,filter,backdrop-filter] duration-150 [&_[data-slot=table-head]]:h-9",
              isTableHeaderSticky
                ? "bg-surface-raised/95 drop-shadow-[0_8px_32px_rgba(255,255,255,0.15)] backdrop-blur-sm"
                : "bg-transparent",
            )}
          >
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="pl-4 text-left text-zinc-400">#</TableHead>
              <TableHead className="group/head relative text-zinc-400 select-none">
                {t("library.podcasts.column.title")}
                <TracklistResizeHandle
                  active={columnLayout.activeDivider === "title"}
                  onDoubleClick={(event) => columnLayout.resetResizePair("title", event)}
                  onPointerDown={(event) => columnLayout.startResize("title", event)}
                />
              </TableHead>
              <TableHead className="group/head relative text-center text-zinc-400 select-none">
                {t("library.podcasts.column.progress")}
                <TracklistResizeHandle
                  active={columnLayout.activeDivider === "progress"}
                  onDoubleClick={(event) => columnLayout.resetResizePair("progress", event)}
                  onPointerDown={(event) => columnLayout.startResize("progress", event)}
                />
              </TableHead>
              {showMetadataColumns && (
                <TableHead className="group/head relative text-zinc-400 select-none">
                  {t("library.podcasts.column.updatedAt")}
                  <TracklistResizeHandle
                    active={columnLayout.activeDivider === "updatedAt"}
                    onDoubleClick={(event) => columnLayout.resetResizePair("updatedAt", event)}
                    onPointerDown={(event) => columnLayout.startResize("updatedAt", event)}
                  />
                </TableHead>
              )}
              {showMetadataColumns && (
                <TableHead className="group/head relative text-right text-zinc-400 select-none">
                  {t("library.podcasts.column.playCount")}
                  <TracklistResizeHandle
                    active={columnLayout.activeDivider === "playCount"}
                    onDoubleClick={(event) => columnLayout.resetResizePair("playCount", event)}
                    onPointerDown={(event) => columnLayout.startResize("playCount", event)}
                  />
                </TableHead>
              )}
              <TableHead className="pr-4 text-right text-zinc-400">
                <span className="flex justify-end" title={t("library.podcasts.column.duration")}>
                  <Clock aria-hidden="true" className="size-4" />
                  <span className="sr-only">{t("library.podcasts.column.duration")}</span>
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="border-none hover:bg-transparent">
                <TableCell
                  colSpan={columnLayout.visibleColumns.length}
                  className="py-10 text-center text-zinc-500"
                >
                  {searchQuery?.trim()
                    ? t("playlist.table.searchNoResults", { query: searchQuery })
                    : t("playlist.table.noFetchedData")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({ program, track }, index) => (
                <RadioProgramRow
                  key={program.id}
                  currentTime={currentTime}
                  index={index}
                  isActive={currentSongDetail?.id === track.id && playlistId === playSourceId}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  program={program}
                  setIsPlaying={setIsPlaying}
                  showPlayCountColumn={showMetadataColumns}
                  showUpdatedAtColumn={showMetadataColumns}
                  track={track}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
