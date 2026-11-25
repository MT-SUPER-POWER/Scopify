"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { SongContextMenu } from "@/components/shared/SongContextMenu";
import { TrackContextMenu } from "@/components/shared/TrackContextMenu";
import { toNeteaseSongDetail } from "@/lib/providers/netease/adapters/track";
import type { PlayerTrackContextMenuProps } from "@/types/song/contextMenuComponents";

const SimilarSongsDialog = dynamic(
  () => import("@/components/song/SimilarSongsDialog").then((module) => module.SimilarSongsDialog),
  { ssr: false },
);

/**
 * 面向多音源统一曲目（PlayerTrack）的右键菜单封装：
 * 网易云曲目走完整的 SongContextMenu（含相似歌曲弹窗），其余音源走 TrackContextMenu。
 */
export function PlayerTrackContextMenu({
  children,
  track,
  isActive,
  isPlaying,
  onPlay,
  playlistId,
  onRemoveFromQueue,
  onDislikeTrack,
}: PlayerTrackContextMenuProps) {
  const song = useMemo(() => toNeteaseSongDetail(track), [track]);
  const [similarOpen, setSimilarOpen] = useState(false);

  if (!song) {
    return (
      <TrackContextMenu
        track={track}
        isActive={isActive}
        isPlaying={isPlaying}
        onPlay={onPlay}
        playlistId={playlistId !== undefined && playlistId !== null ? String(playlistId) : null}
        onRemoveFromQueue={onRemoveFromQueue}
      >
        {children}
      </TrackContextMenu>
    );
  }

  return (
    <>
      <SongContextMenu
        song={song}
        isActive={isActive}
        isPlaying={isPlaying}
        onPlay={onPlay}
        onSimilarSongs={song.voiceId === undefined ? () => setSimilarOpen(true) : undefined}
        playlistID={playlistId}
        onRemoveFromQueue={onRemoveFromQueue}
        onDislikePersonalFm={onDislikeTrack ? () => onDislikeTrack(track) : undefined}
      >
        {children}
      </SongContextMenu>
      {similarOpen && (
        <SimilarSongsDialog song={song} open={similarOpen} onOpenChange={setSimilarOpen} />
      )}
    </>
  );
}
