"use client";

import { memo, useCallback } from "react";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { SortableTrackRow } from "@/components/Playlist/SortableTrackRow";
import type { PlaylistTableSongRowProps } from "@/types/components/playlist";

export const PlaylistTableSongRow = memo(function PlaylistTableSongRow({
  selectedSongs,
  onSelectTrack,
  onContextTrack,
  canRemoveFromPlaylist,
  isDailyRecommend,
  readonly,
  onDislikeDailyRecommend,
  onDislikePersonalFm,
  ...row
}: PlaylistTableSongRowProps) {
  const { track, onPlay, onRequestDelete, playlistID } = row;
  const select = useCallback<NonNullable<typeof row.onRowClick>>(
    (event) => onSelectTrack(track.id, event),
    [onSelectTrack, track.id],
  );
  return (
    <SongContextMenu
      song={track}
      selectedSongs={selectedSongs}
      onOpenContextMenu={() => onContextTrack(track.id)}
      isActive={row.isActive}
      isPlaying={row.isPlaying}
      onPlay={() => onPlay(track)}
      playlistID={playlistID}
      isDailyRecommend={isDailyRecommend}
      readonly={readonly}
      onRemoveFromPlaylist={
        canRemoveFromPlaylist ? () => onRequestDelete(playlistID ?? undefined, track.id) : undefined
      }
      onDislikeDailyRecommend={
        isDailyRecommend ? () => void onDislikeDailyRecommend(track.id) : undefined
      }
      onDislikePersonalFm={onDislikePersonalFm ? () => onDislikePersonalFm(track) : undefined}
    >
      <SortableTrackRow {...row} onRowClick={select} />
    </SongContextMenu>
  );
});
