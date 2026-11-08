"use client";

import { memo, useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CloudSongContextMenu } from "@/components/library/CloudSongContextMenu";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { SortableTrackRow } from "@/components/Playlist/SortableTrackRow";
import { toNeteaseSongDetail } from "@/lib/providers/netease/adapters/track";
import type { PlaylistTableSongRowProps } from "@/types/playlist/components";

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
  cloudActions,
  ...row
}: PlaylistTableSongRowProps) {
  const { track, onPlay, onRequestDelete, playlistID } = row;
  // The song menus act on NetEase songs; another platform's rows have no menu yet.
  const song = useMemo(() => toNeteaseSongDetail(track), [track]);
  const [similarOpen, setSimilarOpen] = useState(false);
  const select = useCallback<NonNullable<typeof row.onRowClick>>(
    (event) => onSelectTrack(track.ref.id, event),
    [onSelectTrack, track.ref.id],
  );
  const rowContent = <SortableTrackRow {...row} onRowClick={select} />;
  if (!song) return rowContent;
  if (cloudActions) {
    return (
      <CloudSongContextMenu
        song={song}
        selectedSongs={selectedSongs}
        cloudActions={cloudActions}
        onOpenContextMenu={() => onContextTrack(track.ref.id)}
        isActive={row.isActive}
        isPlaying={row.isPlaying}
        onPlay={() => onPlay(track)}
      >
        {rowContent}
      </CloudSongContextMenu>
    );
  }
  return (
    <>
      <SongContextMenu
        song={song}
        selectedSongs={selectedSongs}
        onOpenContextMenu={() => onContextTrack(track.ref.id)}
        isActive={row.isActive}
        isPlaying={row.isPlaying}
        onPlay={() => onPlay(track)}
        onSimilarSongs={song.voiceId === undefined ? () => setSimilarOpen(true) : undefined}
        playlistID={playlistID}
        isDailyRecommend={isDailyRecommend}
        readonly={readonly}
        onRemoveFromPlaylist={
          canRemoveFromPlaylist ? () => onRequestDelete(playlistID ?? undefined, track) : undefined
        }
        onDislikeDailyRecommend={
          isDailyRecommend ? () => void onDislikeDailyRecommend(song.id) : undefined
        }
        onDislikePersonalFm={onDislikePersonalFm ? () => onDislikePersonalFm(song) : undefined}
      >
        {rowContent}
      </SongContextMenu>
      {similarOpen && (
        <SimilarSongsDialog song={song} open={similarOpen} onOpenChange={setSimilarOpen} />
      )}
    </>
  );
});
