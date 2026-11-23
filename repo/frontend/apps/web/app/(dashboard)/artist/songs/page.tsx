"use client";

import { LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { QueryConnectionWait } from "@/components/shared/QueryConnectionWait";
import { QueryFailure } from "@/components/shared/QueryFailure";
import { useArtistPopularSongsTheme } from "@/hooks/artist/useArtistPopularSongsTheme";
import { useArtistDetailQuery, useArtistTracksQuery } from "@/hooks/artist/useArtistQueries";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import type { ArtistSongsContentProps } from "@/types/artist/components";
import type { PlaylistInfo } from "@/types/playlist/model";

function ArtistSongsContent({ artistId }: ArtistSongsContentProps) {
  const { t } = useTranslation();
  const artistQuery = useArtistDetailQuery(artistId, true);
  const tracksQuery = useArtistTracksQuery(artistId);
  const artist = artistQuery.data;
  const title = t("artist.songs.title");
  const tracks = useMemo(
    () => tracksQuery.data?.pages.flatMap((page) => page.tracks) ?? [],
    [tracksQuery.data],
  );
  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (!artist) return null;
    return {
      cover: artist.coverUrl ?? artist.avatarUrl,
      createTime: "",
      creator: artist.name,
      creatorAvatar: artist.avatarUrl ?? "",
      isSpecial: true,
      likes: "",
      privacy: title,
      tags: [],
      title: `${artist.name} · ${title}`,
      totalSongs: tracks.length,
    };
  }, [artist, title, tracks.length]);
  const themeColor = useArtistPopularSongsTheme(playlistInfo?.cover);
  const { fetchNextPage, fetchStatus } = tracksQuery;
  const loadNextPage = useCallback(() => {
    if (fetchStatus === "idle") void fetchNextPage();
  }, [fetchNextPage, fetchStatus]);
  const loadMoreRef = useInfiniteScrollTrigger({
    enabled:
      !artistQuery.isPending &&
      !tracksQuery.isPending &&
      tracksQuery.hasNextPage &&
      !tracksQuery.isFetchingNextPage &&
      tracksQuery.fetchStatus === "idle" &&
      !tracksQuery.isFetchNextPageError,
    onIntersect: loadNextPage,
  });

  if (
    (artistQuery.isPending && artistQuery.fetchStatus === "paused") ||
    (tracksQuery.isPending && tracksQuery.fetchStatus === "paused")
  ) {
    return (
      <div className="px-6 py-8">
        <QueryConnectionWait title={title} />
      </div>
    );
  }

  return (
    <>
      <PlaylistContent
        dailyDate={null}
        isDailyRecommend={false}
        isLoading={artistQuery.isPending || tracksQuery.isPending}
        playlistId={null}
        playlistInfo={playlistInfo}
        playSourceId={`artist:${artist?.ref.provider ?? ""}:${artistId}:songs`}
        readonly
        refetchTracks={tracksQuery.refetch}
        themeColor={themeColor}
        tracks={tracks}
      />
      {tracksQuery.hasNextPage && (
        <div className="px-6 pb-24">
          <div ref={loadMoreRef} aria-hidden className="h-px" />
          {tracksQuery.isFetchNextPageError && tracksQuery.error ? (
            <QueryFailure compact error={tracksQuery.error} onRetry={loadNextPage} />
          ) : tracksQuery.fetchStatus === "paused" ? (
            <div className="flex justify-center py-4 text-sm text-content-muted" role="status">
              {t("network.recovery.waiting")}
            </div>
          ) : tracksQuery.isFetchingNextPage ? (
            <div
              role="status"
              aria-label={t("common.status.loading")}
              className="flex justify-center py-4 text-content-muted"
            >
              <LoaderCircle aria-hidden className="size-5 animate-spin" />
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

export default function ArtistSongsPage() {
  const { t } = useTranslation();
  const artistId = useSearchParams().get("id");
  const { provider } = useActiveProvider();
  if (!artistId) {
    return <div className="p-8 text-content-muted">{t("artist.page.invalidId")}</div>;
  }
  return (
    <QueryBoundary resetKey={`artist:songs:${provider}:${artistId}`}>
      <ArtistSongsContent artistId={artistId} />
    </QueryBoundary>
  );
}
