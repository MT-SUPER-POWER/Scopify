"use client";

import { SongTitleWithAlia } from "@/components/shared/SongTitleWithAlia";
import { TrackIndexCell } from "@/components/shared/TrackIndexCell";
import { TableCell, TableRow } from "@/components/ui/table";
import { getRadioProgramPlaybackProgress } from "@/lib/radio/programPlaybackProgress";
import { cn, formatDate, formatDuration, formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { RadioProgramRowProps } from "@/types/components/radio";

export function RadioProgramRow({
  currentTime,
  index,
  isActive,
  isPlaying,
  onPlay,
  program,
  setIsPlaying,
  showPlayCountColumn,
  showUpdatedAtColumn,
  track,
}: RadioProgramRowProps) {
  const { t } = useI18n();
  const duration = program.duration ?? track.dt;
  const playbackProgress = getRadioProgramPlaybackProgress({
    duration,
    isListened: isActive ? false : program.djPlayRecordVo?.isListened,
    listenLocation: isActive ? currentTime : program.djPlayRecordVo?.listenLocation,
  });
  const progressLabel =
    playbackProgress.kind === "complete"
      ? t("library.podcasts.progress.complete")
      : playbackProgress.kind === "partial"
        ? t("library.podcasts.progress.partial", { percentage: playbackProgress.percentage })
        : "—";

  return (
    <TableRow
      className={cn(
        "group cursor-default border-none hover:bg-white/10",
        isActive && "text-[#1ed760]",
      )}
      onDoubleClick={() => onPlay(track)}
    >
      <TableCell className="rounded-l-md pl-4 text-left font-medium">
        <TrackIndexCell
          index={index}
          isActive={isActive}
          isPlaying={isPlaying}
          onPlay={() => onPlay(track)}
          setIsPlaying={setIsPlaying}
        />
      </TableCell>
      <TableCell className="max-w-0 min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="size-10 shrink-0 rounded bg-zinc-800">
            <img
              width={40}
              height={40}
              src={track.al.picUrl}
              alt={track.al.name}
              decoding="async"
              loading="lazy"
              className="size-full rounded object-cover"
            />
          </div>
          <SongTitleWithAlia
            name={program.name ?? track.name}
            alia={track.alia}
            className={cn(
              "w-full cursor-pointer text-base font-normal group-hover:underline",
              isActive ? "text-[#1ed760]" : "text-white",
            )}
          />
        </div>
      </TableCell>
      <TableCell className="truncate text-sm tabular-nums">
        <span className={playbackProgress.kind === "none" ? "text-zinc-600" : "text-zinc-300"}>
          {progressLabel}
        </span>
      </TableCell>
      {showUpdatedAtColumn && (
        <TableCell className="truncate">
          <span title={formatDate(program.createTime ?? 0)}>
            {formatDate(program.createTime ?? 0)}
          </span>
        </TableCell>
      )}
      {showPlayCountColumn && (
        <TableCell className="text-right tabular-nums">
          {formatPlayCount(program.listenerCount ?? 0)}
        </TableCell>
      )}
      <TableCell className="rounded-r-md pr-4 text-right align-middle tabular-nums">
        {formatDuration(duration)}
      </TableCell>
    </TableRow>
  );
}
