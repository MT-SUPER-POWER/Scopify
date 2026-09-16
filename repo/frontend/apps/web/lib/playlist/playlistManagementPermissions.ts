import type { RawNeteasePlaylist } from "@/types/api/playlist";

export function getPlaylistManagementPermissions(
  playlist: RawNeteasePlaylist | undefined,
  userId: number | undefined,
) {
  const known = Boolean(userId && playlist?.id && playlist.creator?.userId);
  const special = playlist?.specialType === 5;
  const owned = known && playlist?.creator?.userId === userId;
  return {
    canManage: owned && !special,
    canUnsubscribe: known && !owned && !special && playlist?.subscribed === true,
  };
}
