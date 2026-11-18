"use client";

import { getLinkableAlbumId, toArtistLinks } from "@/lib/player/trackDisplay";
import { cn } from "@/lib/utils";
import type { CommandWorkspaceQueueItemMetadataProps } from "@/types/commandWorkspace/model";

export function CommandWorkspaceQueueItemMetadata({
  index,
  isCurrent,
  onNavigateAlbum,
  onNavigateArtist,
  onPlay,
  track,
}: CommandWorkspaceQueueItemMetadataProps) {
  const albumId = getLinkableAlbumId(track);
  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        onClick={() => onPlay(index)}
        className={cn(
          "block w-full truncate text-left text-sm font-medium transition-colors hover:underline",
          isCurrent ? "font-semibold text-brand" : "text-content hover:text-brand",
        )}
      >
        {track.title}
      </button>
      <div className="flex items-center truncate text-xs text-content-muted">
        <span className="truncate">
          {toArtistLinks(track).map((artist, artistIndex) => (
            <span key={`${artist.id || artist.name}-${artistIndex}`}>
              {artist.id ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (artist.id) onNavigateArtist(String(artist.id));
                  }}
                  className="hover:text-content hover:underline focus-visible:text-content"
                >
                  {artist.name}
                </button>
              ) : (
                <span>{artist.name}</span>
              )}
              {artistIndex < track.artists.length - 1 ? " / " : ""}
            </span>
          ))}
        </span>
        {track.album?.title ? (
          <>
            <span className="mx-1 text-content-subtle">·</span>
            {albumId ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onNavigateAlbum(albumId);
                }}
                title={track.album.title}
                className="max-w-35 truncate text-content-muted hover:text-content hover:underline focus-visible:text-content"
              >
                {track.album.title}
              </button>
            ) : (
              <span className="max-w-35 truncate text-content-muted">{track.album.title}</span>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
