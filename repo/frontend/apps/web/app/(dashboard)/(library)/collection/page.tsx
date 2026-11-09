"use client";

import { Bookmark, Heart, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { LibraryMediaGrid } from "@/components/library/LibraryMediaGrid";
import { QuietState } from "@/components/shared/QuietState";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useLibraryAlbumsQuery } from "@/hooks/library/useLibraryAlbums";
import {
  useLibraryPlaylistsQuery,
  useLikedPlaylistQuery,
} from "@/hooks/library/useLibraryPlaylists";
import { useFollowedArtistsQuery } from "@/hooks/library/useLibraryQueries";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import type { TranslationKey } from "@/lib/i18n";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { LibraryMediaItem } from "@/types/library/model";

type CollectionTab = "songs" | "playlists" | "albums" | "artists";

/** What the account saved: its liked songs, and the playlists, albums and artists it keeps. */
export default function CollectionPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useActiveAccount();
  const canFollow = useProviderCapability("artist.follow");
  const likedQuery = useLikedPlaylistQuery();
  const playlistsQuery = useLibraryPlaylistsQuery();
  const albumsQuery = useLibraryAlbumsQuery();
  const artistsQuery = useFollowedArtistsQuery();

  const liked = likedQuery.data;
  const playlists = useMemo<LibraryMediaItem[]>(
    () =>
      (playlistsQuery.data ?? [])
        .filter((item) => item.relation === "subscribed")
        .map((item) => ({
          coverUrl: getSizedImageUrl(item.playlist.coverUrl, 300) || undefined,
          href: `/playlist?id=${encodeURIComponent(item.playlist.ref.id)}`,
          id: item.playlist.ref.id,
          subtitle: [
            t("home.playlistSummary", { count: item.playlist.trackCount }),
            item.playlist.creator?.name,
          ]
            .filter(Boolean)
            .join(" · "),
          title: item.playlist.title,
        })),
    [playlistsQuery.data, t],
  );
  const albums = albumsQuery.data ?? [];
  const artists = artistsQuery.data?.artists ?? [];

  const tabs: { key: CollectionTab; count: number | null }[] = [
    { key: "songs", count: liked?.playlist.trackCount ?? null },
    { key: "playlists", count: playlists.length },
    { key: "albums", count: albums.length },
    ...(canFollow ? [{ key: "artists" as const, count: artists.length }] : []),
  ];
  const requested = searchParams.get("tab");
  const active = tabs.find((tab) => tab.key === requested)?.key ?? "songs";
  const selectTab = (key: CollectionTab) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  if (!isLoggedIn) {
    return (
      <>
        <CollectionHeader title={t("library.title.collection")} />
        <QuietState icon={Bookmark} title={t("library.loggedOut.collection")} />
      </>
    );
  }

  const grid = (
    items: LibraryMediaItem[],
    query: { isError: boolean; isLoading: boolean; isRefetching: boolean; refetch: () => unknown },
    emptyKey: TranslationKey,
  ) => (
    <LibraryContentState
      hasItems={items.length > 0}
      isError={query.isError}
      isLoading={query.isLoading}
      isRetrying={query.isRefetching}
      emptyState={<QuietState icon={Bookmark} title={t(emptyKey)} />}
      onRetry={() => void query.refetch()}
    >
      <LibraryMediaGrid items={items} />
    </LibraryContentState>
  );

  return (
    <>
      <CollectionHeader title={t("library.title.collection")} />
      <div role="tablist" className="mb-8 flex items-center gap-6 border-b border-content/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active}
            onClick={() => selectTab(tab.key)}
            className={cn(
              "-mb-px cursor-pointer border-b-2 px-1 pb-3 text-base font-medium transition-colors",
              tab.key === active
                ? "border-brand text-content"
                : "border-transparent text-content-muted hover:text-content",
            )}
          >
            {t(`library.collection.tab.${tab.key}`)}
            {tab.count !== null && (
              <span className="ml-1.5 text-sm text-content-muted">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {active === "songs" && (
        <LibraryContentState
          hasItems={liked !== null && liked !== undefined}
          isError={likedQuery.isError}
          isLoading={likedQuery.isLoading}
          isRetrying={likedQuery.isRefetching}
          emptyState={
            <QuietState
              icon={Heart}
              title={t("library.empty.liked.title")}
              description={t("library.empty.liked.description")}
            />
          }
          onRetry={() => void likedQuery.refetch()}
        >
          {liked && (
            <Link
              href="/liked"
              className="group flex max-w-xl items-center gap-5 rounded-xl bg-content/5 p-5 transition-colors hover:bg-content/10"
            >
              <div className="relative size-28 shrink-0 overflow-hidden rounded-lg bg-surface-elevated">
                {liked.playlist.coverUrl ? (
                  <Image
                    src={getSizedImageUrl(liked.playlist.coverUrl, 300)}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <Heart className="absolute inset-0 m-auto size-10 text-brand" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold text-content">
                  {t("sidebar.library.likedMusic")}
                </h2>
                <p className="mt-1 text-sm text-content-muted">
                  {t("home.playlistSummary", { count: liked.playlist.trackCount })}
                </p>
              </div>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand transition-transform group-hover:scale-105">
                <Play className="ml-0.5 size-6 fill-current" />
              </span>
            </Link>
          )}
        </LibraryContentState>
      )}
      {active === "playlists" &&
        grid(playlists, playlistsQuery, "library.collection.empty.playlists")}
      {active === "albums" && grid(albums, albumsQuery, "library.collection.empty.albums")}
      {active === "artists" && grid(artists, artistsQuery, "library.collection.empty.artists")}
    </>
  );
}

function CollectionHeader({ title }: { title: string }) {
  return (
    <header className="pb-6">
      <h1 className="text-4xl font-bold tracking-tight text-content">{title}</h1>
    </header>
  );
}
