"use client";

import PlaylistLoading from "@/components/Playlist/PlaylistLoading";
import TracklistTable from "@/components/Playlist/TrackTable";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { LibraryEmptyState } from "@/components/library/LibraryEmptyState";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import { useLikedSongsQuery } from "@/hooks/library/useLibraryQueries";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";

export default function LikedSongsPage() {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const router = useSmartRouter();
  const likedSongsQuery = useLikedSongsQuery();
  const tracks = likedSongsQuery.data ?? [];

  return (
    <main className="min-h-screen bg-[#121212] px-6 pt-24 pb-28 md:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <LibraryPageHeader title={t("library.title.liked")} />
        {!isLoggedIn ? (
          <LoginRequiredPrompt
            reason="library"
            onLogin={() => router.push("/login?reason=library")}
          />
        ) : (
          <LibraryContentState
            hasItems={tracks.length > 0}
            isError={likedSongsQuery.isError}
            isLoading={likedSongsQuery.isLoading}
            isRetrying={likedSongsQuery.isRefetching}
            loadingContent={<PlaylistLoading />}
            emptyState={
              <LibraryEmptyState
                title={t("library.empty.liked.title")}
                description={t("library.empty.liked.description")}
              />
            }
            onRetry={() => void likedSongsQuery.refetch()}
          >
            <TracklistTable
              tracks={tracks}
              playSourceId="library:liked"
              disableVirtualization
              hideDateColumn
              readonly
            />
          </LibraryContentState>
        )}
      </div>
    </main>
  );
}
