import { useUserLikedSongIdsQuery, useUserPlaylistsQuery } from "@/hooks/library/useLibraryQueries";
import { useTranslation } from "react-i18next";

export function useSidebarPlaylists() {
  const { t } = useTranslation();
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
