import { useUserPlaylistsQuery } from "@/hooks/library/useLibraryQueries";
import { useLikedTrackIdsQuery } from "@/hooks/library/useLikedTracks";

export function useSidebarPlaylists() {
  const query = useUserPlaylistsQuery(true);
  useLikedTrackIdsQuery();

  return {
    error: query.data === undefined ? query.error : null,
    refreshError: query.data !== undefined ? query.error : null,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    isPaused: query.data === undefined && query.fetchStatus === "paused",
    playlists: query.data,
    reload: () => query.refetch(),
  };
}
