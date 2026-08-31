"use client";

import { cn } from "@/lib/utils";
import type { CommandWorkspaceQueueItemMetadataProps } from "@/types/commandWorkspace";

export function CommandWorkspaceQueueItemMetadata({
  index,
  isCurrent,
  onNavigateAlbum,
  onNavigateArtist,
  onPlay,
  track,
}: CommandWorkspaceQueueItemMetadataProps) {
  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        onClick={() => onPlay(index)}
        className={cn(
          "block w-full truncate text-left text-sm font-medium transition-colors hover:underline",
          isCurrent ? "font-semibold text-brand" : "text-white hover:text-brand",
        )}
      >
        {track.name}
      </button>
      <div className="flex items-center truncate text-xs text-zinc-400">
        <span className="truncate">
          {track.ar?.map((artist, artistIndex) => (
            <span key={`${artist.id || artist.name}-${artistIndex}`}>
              {artist.id ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onNavigateArtist(artist.id);
                  }}
                  className="hover:text-white hover:underline focus-visible:text-white"
                >
                  {artist.name}
                </button>
              ) : (
                <span>{artist.name}</span>
              )}
              {artistIndex < (track.ar?.length ?? 0) - 1 ? " / " : ""}
            </span>
          ))}
        </span>
        {track.al?.name ? (
          <>
            <span className="mx-1 text-zinc-600">·</span>
            {track.al.id ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onNavigateAlbum(track.al.id);
                }}
                title={track.al.name}
                className="max-w-35 truncate text-zinc-400 hover:text-white hover:underline focus-visible:text-white"
              >
                {track.al.name}
              </button>
            ) : (
              <span className="max-w-35 truncate text-zinc-400">{track.al.name}</span>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
