"use client";

import { useBatchSongLike } from "@/hooks/playlist/useBatchSongLike";
import { usePlaylistTrackDrop } from "@/hooks/playlist/usePlaylistTrackDrop";
import { useTrackDropTarget } from "@/hooks/playlist/useTrackDropTarget";
import { isRealUser } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from "@/store";
import { useAppDragStore } from "@/store/module/appDrag";
import type { NeteasePlaylist } from "@/types/api/playlist";

export function useSidebarPlaylistDrop(playlist: NeteasePlaylist) {
  const user = useUserStore((state) => state.user);
  const sourceId = useAppDragStore((state) => state.sourcePlaylistId);
  const addTracks = usePlaylistTrackDrop();
  const { batchLike } = useBatchSongLike();
  const liked = playlist.specialType === 5;
  return useTrackDropTarget({
    id: liked ? "liked" : `playlist:${playlist.id}`,
    enabled: isRealUser(user) && playlist.creator.userId === user?.userId && String(playlist.id) !== sourceId,
    onDrop: (tracks) => liked ? batchLike(tracks, true) : addTracks({ playlistId: playlist.id, tracks }),
  });
}
