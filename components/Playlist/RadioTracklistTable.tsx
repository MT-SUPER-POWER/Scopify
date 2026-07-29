"use client";

import { useCallback, useMemo } from "react";
import { RadioProgramRow } from "@/components/Playlist/RadioProgramRow";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DASHBOARD_HEADER_HEIGHT } from "@/constants/layout";
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
      <div className="-mx-4">
        <Table containerClassName="overflow-x-auto" className="min-w-230 table-fixed text-zinc-400">
          <colgroup>
            <col className="w-12" />
            <col className="w-[38%]" />
            <col className="w-[24%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <TableHeader
            style={{ top: DASHBOARD_HEADER_HEIGHT }}
            className="sticky z-10 bg-[#121212]/95 drop-shadow-[0_8px_32px_rgba(255,255,255,0.15)] backdrop-blur-sm [&_[data-slot=table-head]]:h-9"
          >
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="pl-4 text-left text-zinc-400">#</TableHead>
              <TableHead className="text-zinc-400">{t("library.podcasts.column.title")}</TableHead>
              <TableHead className="text-zinc-400">
                {t("library.podcasts.column.progress")}
              </TableHead>
              <TableHead className="text-zinc-400">
                {t("library.podcasts.column.updatedAt")}
              </TableHead>
              <TableHead className="text-right text-zinc-400">
                {t("library.podcasts.column.playCount")}
              </TableHead>
              <TableHead className="pr-4 text-right text-zinc-400">
                {t("library.podcasts.column.duration")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="border-none hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center text-zinc-500">
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
