import { useUserLikedSongIdsQuery, useUserPlaylistsQuery } from "@/hooks/library/useLibraryQueries";

export function useSidebarPlaylists() {
  const query = useUserPlaylistsQuery(true);
  useUserLikedSongIdsQuery();

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
