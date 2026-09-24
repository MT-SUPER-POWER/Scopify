"use client";

import { memo, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { SortableTrackRow } from "@/components/Playlist/SortableTrackRow";
import type { PlaylistTableSongRowProps } from "@/types/components/playlist";

const SimilarSongsDialog = dynamic(
  () => import("@/components/song/SimilarSongsDialog").then((module) => module.SimilarSongsDialog),
  { ssr: false },
);

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
  const [similarOpen, setSimilarOpen] = useState(false);
  const select = useCallback<NonNullable<typeof row.onRowClick>>(
    (event) => onSelectTrack(track.id, event),
    [onSelectTrack, track.id],
  );
  return (
    <>
      <SongContextMenu
        song={track}
        selectedSongs={selectedSongs}
        onOpenContextMenu={() => onContextTrack(track.id)}
        isActive={row.isActive}
        isPlaying={row.isPlaying}
        onPlay={() => onPlay(track)}
        onSimilarSongs={track.voiceId === undefined ? () => setSimilarOpen(true) : undefined}
        playlistID={playlistID}
        isDailyRecommend={isDailyRecommend}
        readonly={readonly}
        onRemoveFromPlaylist={
          canRemoveFromPlaylist
            ? () => onRequestDelete(playlistID ?? undefined, track.id)
            : undefined
        }
        onDislikeDailyRecommend={
          isDailyRecommend ? () => void onDislikeDailyRecommend(track.id) : undefined
        }
        onDislikePersonalFm={onDislikePersonalFm ? () => onDislikePersonalFm(track) : undefined}
      >
        <SortableTrackRow {...row} onRowClick={select} />
      </SongContextMenu>
      {similarOpen && (
        <SimilarSongsDialog song={track} open={similarOpen} onOpenChange={setSimilarOpen} />
      )}
    </>
  );
});
