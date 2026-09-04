/**
 * Data required to decide whether the current viewer may mutate a playlist's tracks.
 *
 * This intentionally has no dependency on React, Zustand, or the route. A caller must
 * provide both identities explicitly so an incomplete login or playlist response fails
 * closed instead of accidentally exposing a destructive action.
 */
export interface PlaylistTrackRemovalPermissionInput {
  creatorId: number | string | null | undefined;
  currentUserId: number | string | null | undefined;
  isDailyRecommendation: boolean;
  isHistoricalDailyRecommendation: boolean;
  isVirtualPlaylist: boolean;
  playlistId: number | string | null | undefined;
  readonly: boolean;
}

function hasStableId(value: number | string | null | undefined): value is number | string {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

/**
 * Returns whether removing a track is valid for this playlist context.
 *
 * Daily recommendations, history, and other virtual surfaces resemble playlists in the
 * UI but do not represent a mutable playlist resource. Even for a normal playlist, the
 * action is available only to its creator; missing identity data always denies access.
 */
export function canRemoveTracksFromPlaylist({
  creatorId,
  currentUserId,
  isDailyRecommendation,
  isHistoricalDailyRecommendation,
  isVirtualPlaylist,
  playlistId,
  readonly,
}: PlaylistTrackRemovalPermissionInput) {
  if (
    readonly ||
    isDailyRecommendation ||
    isHistoricalDailyRecommendation ||
    isVirtualPlaylist ||
    !hasStableId(playlistId) ||
    !hasStableId(creatorId) ||
    !hasStableId(currentUserId)
  ) {
    return false;
  }

  return String(creatorId) === String(currentUserId);
}
