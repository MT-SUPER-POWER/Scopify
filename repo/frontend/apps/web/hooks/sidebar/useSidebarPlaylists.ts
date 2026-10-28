import { useUserLikedSongIdsQuery, useUserPlaylistsQuery } from "@/hooks/library/useLibraryQueries";
import { useI18n } from "@/store/module/i18n";

export function useSidebarPlaylists() {
  const { t } = useI18n();
  const query = useUserPlaylistsQuery();
  useUserLikedSongIdsQuery();

  const errorMessage =
    query.error && query.data === undefined
      ? query.error instanceof Error
        ? query.error.message
        : t("sidebar.card.loadFailed")
      : null;

  return {
    error: errorMessage,
    isLoading: query.isLoading,
    isPaused: query.isPending && query.fetchStatus === "paused",
    playlists: query.data ?? [],
    reload: () => query.refetch(),
  };
}
