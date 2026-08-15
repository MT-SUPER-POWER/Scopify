import { useUserPlaylistsQuery } from "@/hooks/library/useLibraryQueries";
import { useI18n } from "@/store/module/i18n";

export function useSidebarPlaylists() {
  const { t } = useI18n();
  const query = useUserPlaylistsQuery();

  const errorMessage = query.error
    ? query.error instanceof Error
      ? query.error.message
      : t("sidebar.card.loadFailed")
    : null;

  return {
    error: errorMessage,
    isLoading: query.isLoading,
    playlists: query.data ?? [],
    reload: () => query.refetch(),
  };
}
