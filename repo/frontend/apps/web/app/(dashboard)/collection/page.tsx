"use client";

import { Bookmark } from "lucide-react";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { LibraryMediaGrid } from "@/components/library/LibraryMediaGrid";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";
import { AppBackground } from "@/components/shared/AppBackground";
import { QuietState } from "@/components/shared/QuietState";
import { useCollectionQuery } from "@/hooks/library/useLibraryQueries";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useI18n } from "@/store/module/i18n";

export default function CollectionPage() {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const collectionQuery = useCollectionQuery();
  const albums = collectionQuery.data?.albums ?? [];
  const artists = collectionQuery.data?.artists ?? [];

  return (
    <main className="relative min-h-screen bg-surface-raised px-6 pt-8 pb-28 md:px-10">
      {isLoggedIn ? <AppBackground /> : null}
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <LibraryPageHeader title={t("library.title.collection")} />
        {!isLoggedIn ? (
          <QuietState icon={Bookmark} title={t("library.loggedOut.collection")} />
        ) : (
          <LibraryContentState
            hasItems={albums.length > 0 || artists.length > 0}
            isError={collectionQuery.isError}
            isLoading={collectionQuery.isLoading}
            isRetrying={collectionQuery.isRefetching}
            emptyState={
              <QuietState
                icon={Bookmark}
                title={t("library.empty.collection.title")}
                description={t("library.empty.collection.description")}
              />
            }
            onRetry={() => void collectionQuery.refetch()}
          >
            <div className="space-y-12">
              {albums.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl font-bold text-content">
                    {t("library.section.albums")}
                  </h2>
                  <LibraryMediaGrid items={albums} />
                </section>
              )}
              {artists.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl font-bold text-content">
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
