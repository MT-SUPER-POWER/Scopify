"use client";

import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

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
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import {
  usePlaybackPosition as usePlaybackPositionMs,
  usePlaybackProjection,
} from "@/hooks/player/usePlaybackProjection";
import { useRadioTracklistColumnLayout } from "@/hooks/radio/useRadioTracklistColumnLayout";
import { useRadioTracklistStickyHeader } from "@/hooks/radio/useRadioTracklistStickyHeader";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { RadioTracklistTableProps } from "@/types/components/radio";

type RadioSortKey = "title" | "progress" | "updatedAt" | "playCount" | "duration";

interface RadioSortState {
  key: RadioSortKey | null;
  order: "asc" | "desc" | null;
}

export function RadioTracklistTable({
  programs,
  radioId,
  searchQuery,
  tracks,
}: RadioTracklistTableProps) {
  const { t } = useI18n();
  const [sortState, setSortState] = useState<RadioSortState>({ key: null, order: null });
  const playback = usePlaybackProjection();
  const currentTime = usePlaybackPositionMs();
  const commands = usePlaybackCommands();
  const playlistId = usePlayerStore((state) => state.playlistId);
  const playFromSong = usePlayerStore((state) => state.playFromSong);
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

  const handleToggleSort = useCallback((key: RadioSortKey) => {
    setSortState((current) => {
      if (current.key !== key) {
        // Defaults: title is asc first, metrics (time/count/progress/duration) are desc first
        const defaultOrder = key === "title" ? "asc" : "desc";
        return { key, order: defaultOrder };
      }
      const firstOrder = key === "title" ? "asc" : "desc";
      const secondOrder = key === "title" ? "desc" : "asc";

      if (current.order === firstOrder) {
        return { key, order: secondOrder };
      }
      return { key: null, order: null };
    });
  }, []);

  const handleResetSort = useCallback(() => {
    setSortState({ key: null, order: null });
  }, []);

  const sortedRows = useMemo(() => {
    const { key, order } = sortState;
    if (!key || !order) return rows;

    return [...rows].sort((a, b) => {
      let comparison = 0;
      switch (key) {
        case "title": {
          const titleA = a.program.name || a.track.name || "";
          const titleB = b.program.name || b.track.name || "";
          comparison = titleA.localeCompare(titleB, undefined, {
            numeric: true,
            sensitivity: "base",
          });
          break;
        }
        case "progress": {
          const progA =
            (a.program.djPlayRecordVo?.listenLocation ?? 0) /
            (a.program.duration ?? a.track.dt ?? 1);
          const progB =
            (b.program.djPlayRecordVo?.listenLocation ?? 0) /
            (b.program.duration ?? b.track.dt ?? 1);
          comparison = progA - progB;
          break;
        }
        case "updatedAt": {
          const timeA = a.program.createTime ?? 0;
          const timeB = b.program.createTime ?? 0;
          comparison = timeA - timeB;
          break;
        }
        case "playCount": {
          const countA = a.program.listenerCount ?? a.program.score ?? 0;
          const countB = b.program.listenerCount ?? b.program.score ?? 0;
          comparison = countA - countB;
          break;
        }
        case "duration": {
          const durA = a.program.duration ?? a.track.dt ?? 0;
          const durB = b.program.duration ?? b.track.dt ?? 0;
          comparison = durA - durB;
          break;
        }
      }
      return order === "asc" ? comparison : -comparison;
    });
  }, [rows, sortState]);

  const sortedTracks = useMemo(() => sortedRows.map((r) => r.track), [sortedRows]);

  const handlePlay = useCallback(
    (track: (typeof rows)[number]["track"]) => {
      const isCurrent = playback.track?.id === track.id && playlistId === playSourceId;
      if (isCurrent) {
        void commands.toggle();
        return;
      }

      void playFromSong(track, sortedTracks, playSourceId);
    },
    [commands, playback.track?.id, playFromSong, playSourceId, playlistId, sortedTracks],
  );
  const setIsPlaying = useCallback(
    (shouldPlay: boolean) => {
      void (shouldPlay ? commands.play() : commands.pause());
    },
    [commands],
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
              <TableHead
                className="cursor-pointer pl-4 text-left text-zinc-400 transition-colors hover:text-zinc-200"
                onClick={handleResetSort}
                title={sortState.key ? "点击恢复默认排序" : undefined}
              >
                <span className="flex size-4 items-center justify-center">#</span>
              </TableHead>
              <TableHead
                className="group/head relative cursor-pointer text-zinc-400 transition-colors select-none hover:text-zinc-200"
                onClick={() => handleToggleSort("title")}
              >
                <div className="flex items-center gap-1">
                  {t("library.podcasts.column.title")}
                  {sortState.key === "title" && sortState.order === "asc" && (
                    <ChevronUp className="size-4" />
                  )}
                  {sortState.key === "title" && sortState.order === "desc" && (
                    <ChevronDown className="size-4" />
                  )}
                </div>
                <TracklistResizeHandle
                  active={columnLayout.activeDivider === "title"}
                  onDoubleClick={(event) => columnLayout.resetResizePair("title", event)}
                  onPointerDown={(event) => columnLayout.startResize("title", event)}
                />
              </TableHead>
              <TableHead
                className="group/head relative cursor-pointer text-center text-zinc-400 transition-colors select-none hover:text-zinc-200"
                onClick={() => handleToggleSort("progress")}
              >
                <div className="flex items-center justify-center gap-1">
                  {t("library.podcasts.column.progress")}
                  {sortState.key === "progress" && sortState.order === "asc" && (
                    <ChevronUp className="size-4" />
                  )}
                  {sortState.key === "progress" && sortState.order === "desc" && (
                    <ChevronDown className="size-4" />
                  )}
                </div>
                <TracklistResizeHandle
                  active={columnLayout.activeDivider === "progress"}
                  onDoubleClick={(event) => columnLayout.resetResizePair("progress", event)}
                  onPointerDown={(event) => columnLayout.startResize("progress", event)}
                />
              </TableHead>
              {showMetadataColumns && (
                <TableHead
                  className="group/head relative cursor-pointer text-zinc-400 transition-colors select-none hover:text-zinc-200"
                  onClick={() => handleToggleSort("updatedAt")}
                >
                  <div className="flex items-center gap-1">
                    {t("library.podcasts.column.updatedAt")}
                    {sortState.key === "updatedAt" && sortState.order === "asc" && (
                      <ChevronUp className="size-4" />
                    )}
                    {sortState.key === "updatedAt" && sortState.order === "desc" && (
                      <ChevronDown className="size-4" />
                    )}
                  </div>
                  <TracklistResizeHandle
                    active={columnLayout.activeDivider === "updatedAt"}
                    onDoubleClick={(event) => columnLayout.resetResizePair("updatedAt", event)}
                    onPointerDown={(event) => columnLayout.startResize("updatedAt", event)}
                  />
                </TableHead>
              )}
              {showMetadataColumns && (
                <TableHead
                  className="group/head relative cursor-pointer text-right text-zinc-400 transition-colors select-none hover:text-zinc-200"
                  onClick={() => handleToggleSort("playCount")}
                >
                  <div className="flex items-center justify-end gap-1">
                    {t("library.podcasts.column.playCount")}
                    {sortState.key === "playCount" && sortState.order === "asc" && (
                      <ChevronUp className="size-4" />
                    )}
                    {sortState.key === "playCount" && sortState.order === "desc" && (
                      <ChevronDown className="size-4" />
                    )}
                  </div>
                  <TracklistResizeHandle
                    active={columnLayout.activeDivider === "playCount"}
                    onDoubleClick={(event) => columnLayout.resetResizePair("playCount", event)}
                    onPointerDown={(event) => columnLayout.startResize("playCount", event)}
                  />
                </TableHead>
              )}
              <TableHead
                className="cursor-pointer pr-4 text-right text-zinc-400 transition-colors hover:text-zinc-200"
                onClick={() => handleToggleSort("duration")}
              >
                <span
                  className="flex items-center justify-end gap-1"
                  title={t("library.podcasts.column.duration")}
                >
                  <Clock aria-hidden="true" className="size-4" />
                  {sortState.key === "duration" && sortState.order === "asc" && (
                    <ChevronUp className="size-4" />
                  )}
                  {sortState.key === "duration" && sortState.order === "desc" && (
                    <ChevronDown className="size-4" />
                  )}
                  <span className="sr-only">{t("library.podcasts.column.duration")}</span>
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.length === 0 ? (
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
              sortedRows.map(({ program, track }, index) => (
                <RadioProgramRow
                  key={program.id}
                  currentTime={currentTime}
                  index={index}
                  isActive={playback.track?.id === track.id && playlistId === playSourceId}
                  isPlaying={playback.isPlaying}
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
