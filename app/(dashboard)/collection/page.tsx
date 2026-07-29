"use client";

import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { LibraryEmptyState } from "@/components/library/LibraryEmptyState";
import { LibraryMediaGrid } from "@/components/library/LibraryMediaGrid";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import { TimeBasedBackground } from "@/components/shared/TimeBasedBackground";
import { useCollectionQuery } from "@/hooks/library/useLibraryQueries";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";

export default function CollectionPage() {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const router = useSmartRouter();
  const collectionQuery = useCollectionQuery();
  const albums = collectionQuery.data?.albums ?? [];
  const artists = collectionQuery.data?.artists ?? [];

  return (
    <main className="relative min-h-screen bg-[#121212] px-6 pt-24 pb-28 md:px-10">
      <TimeBasedBackground />
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <LibraryPageHeader title={t("library.title.collection")} />
        {!isLoggedIn ? (
          <LoginRequiredPrompt
            reason="library"
            onLogin={() => router.push("/login?reason=library")}
          />
        ) : (
          <LibraryContentState
            hasItems={albums.length > 0 || artists.length > 0}
            isError={collectionQuery.isError}
            isLoading={collectionQuery.isLoading}
            isRetrying={collectionQuery.isRefetching}
            emptyState={
              <LibraryEmptyState
                title={t("library.empty.collection.title")}
                description={t("library.empty.collection.description")}
              />
            }
            onRetry={() => void collectionQuery.refetch()}
          >
            <div className="space-y-12">
              {albums.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl font-bold text-white">
                    {t("library.section.albums")}
                  </h2>
                  <LibraryMediaGrid items={albums} />
                </section>
              )}
              {artists.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl font-bold text-white">
                    {t("library.section.artists")}
                  </h2>
                  <LibraryMediaGrid items={artists} />
                </section>
              )}
            </div>
          </LibraryContentState>
        )}
      </div>
    </main>
  );
}
