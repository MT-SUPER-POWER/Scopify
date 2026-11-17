"use client";

import { Button } from "@scopify/ui/shadcn/components/button";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { QueryConnectionWait } from "@/components/shared/QueryConnectionWait";
import { QueryFailure } from "@/components/shared/QueryFailure";
import { useArtistPopularSongsTheme } from "@/hooks/artist/useArtistPopularSongsTheme";
import { useArtistDetailQuery, useArtistTracksQuery } from "@/hooks/artist/useArtistQueries";
import type { ArtistSongsContentProps } from "@/types/artist/components";
import type { PlaylistInfo } from "@/types/playlist/model";

function ArtistSongsContent({ artistId }: ArtistSongsContentProps) {
  const { t } = useTranslation();
  const artistQuery = useArtistDetailQuery(artistId, true);
  const tracksQuery = useArtistTracksQuery(artistId);
  const artist = artistQuery.data?.data.artist;
  const title = t("artist.songs.title");
  const tracks = useMemo(
    () => tracksQuery.data?.pages.flatMap((page) => page.tracks) ?? [],
    [tracksQuery.data],
  );
  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (!artist) return null;
    return {
      cover: artist.cover || artist.avatar,
      createTime: "",
      creator: artist.name,
      creatorAvatar: artist.avatar,
      isSpecial: true,
      likes: "",
      privacy: title,
      tags: [],
      title: `${artist.name} · ${title}`,
      totalSongs: tracks.length,
    };
  }, [artist, title, tracks.length]);
  const themeColor = useArtistPopularSongsTheme(playlistInfo?.cover);
  const loadNextPage = () => {
    if (tracksQuery.fetchStatus === "idle") void tracksQuery.fetchNextPage();
  };

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
        playSourceId={`artist:${artistId}:songs`}
        readonly
        refetchTracks={tracksQuery.refetch}
        themeColor={themeColor}
        tracks={tracks}
      />
      {tracksQuery.hasNextPage && (
        <div className="px-6 pb-24">
          {tracksQuery.isFetchNextPageError && tracksQuery.error ? (
            <QueryFailure compact error={tracksQuery.error} onRetry={loadNextPage} />
          ) : (
            <Button
              variant="outline"
              disabled={tracksQuery.fetchStatus !== "idle"}
              onClick={loadNextPage}
            >
              {tracksQuery.fetchStatus === "paused"
                ? t("network.recovery.waiting")
                : tracksQuery.isFetchingNextPage
                  ? t("common.status.loading")
                  : t("artist.songs.loadMore")}
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export default function ArtistSongsPage() {
  const { t } = useTranslation();
  const artistId = useSearchParams().get("id");
  if (!artistId) {
    return <div className="p-8 text-content-muted">{t("artist.page.invalidId")}</div>;
  }
  return (
    <QueryBoundary resetKey={`artist:songs:${artistId}`}>
      <ArtistSongsContent artistId={artistId} />
    </QueryBoundary>
  );
}
