"use client";

import { Bookmark } from "lucide-react";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { LibraryMediaGrid } from "@/components/library/LibraryMediaGrid";
import { QuietState } from "@/components/shared/QuietState";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useLibraryAlbumsQuery } from "@/hooks/library/useLibraryAlbums";
import { useFollowedArtistsQuery } from "@/hooks/library/useLibraryQueries";
import { useTranslation } from "react-i18next";

import { LibraryPageHeader } from "./_components/LibraryPageHeader";

export default function CollectionPage() {
  const { t } = useTranslation();
  const { isLoggedIn } = useActiveAccount();
  const albumsQuery = useLibraryAlbumsQuery();
  const artistsQuery = useFollowedArtistsQuery();
  const albums = albumsQuery.data ?? [];
  const artists = artistsQuery.data?.artists ?? [];

  return (
    <>
      <LibraryPageHeader title={t("library.title.collection")} />
      {!isLoggedIn ? (
        <QuietState icon={Bookmark} title={t("library.loggedOut.collection")} />
      ) : (
        <LibraryContentState
          hasItems={albums.length > 0 || artists.length > 0}
          isError={albumsQuery.isError || artistsQuery.isError}
          isLoading={albumsQuery.isLoading || artistsQuery.isLoading}
          isRetrying={albumsQuery.isRefetching || artistsQuery.isRefetching}
          emptyState={
            <QuietState
              icon={Bookmark}
              title={t("library.empty.collection.title")}
              description={t("library.empty.collection.description")}
            />
          }
          onRetry={() => {
            if (albumsQuery.isError) void albumsQuery.refetch();
            if (artistsQuery.isError) void artistsQuery.refetch();
          }}
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
    </>
  );
}
