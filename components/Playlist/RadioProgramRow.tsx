"use client";

import { TrackIndexCell } from "@/components/Playlist/TrackRow";
import { SongTitleWithAlia } from "@/components/shared/SongTitleWithAlia";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn, formatDate, formatDuration, formatPlayCount } from "@/lib/utils";
import type { RadioProgramRowProps } from "@/types/components/radio";

export function RadioProgramRow({
  currentTime,
  index,
  isActive,
  isPlaying,
  onPlay,
  program,
  setIsPlaying,
  track,
}: RadioProgramRowProps) {
  const duration = program.duration ?? track.dt;
  const elapsed = Math.min(currentTime, duration);
  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;

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
      <TableCell className="max-w-0">
        {isActive ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-1 min-w-24 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#1ed760]" style={{ width: `${progress}%` }} />
            </div>
            <span className="shrink-0 text-xs text-zinc-400 tabular-nums">
              {formatDuration(elapsed)} / {formatDuration(duration)}
            </span>
          </div>
        ) : (
          <span className="text-zinc-600">—</span>
        )}
      </TableCell>
      <TableCell className="truncate">
        <span title={formatDate(program.createTime ?? 0)}>
          {formatDate(program.createTime ?? 0)}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatPlayCount(program.listenerCount ?? 0)}
      </TableCell>
      <TableCell className="rounded-r-md pr-4 text-right align-middle tabular-nums">
        {formatDuration(duration)}
      </TableCell>
    </TableRow>
  );
}
