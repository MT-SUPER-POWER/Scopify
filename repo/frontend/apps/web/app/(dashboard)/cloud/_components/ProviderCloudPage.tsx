"use client";

import { Cloud } from "lucide-react";
import { useMemo } from "react";
import { LibraryErrorPage } from "@/components/library/LibraryErrorPage";
import { LibraryStatePage } from "@/components/library/LibraryStatePage";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { QuietState } from "@/components/shared/QuietState";
import { CLOUD_SONG_FALLBACK_COVER } from "@/constants/cloud";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useProviderCloudQuery } from "@/hooks/library/useProviderLibraryLists";
import { useTranslation } from "react-i18next";

import type { PlaylistInfo } from "@/types/playlist/model";

/**
 * The cloud drive of a platform that only lists it: songs matched to the catalog, played like
 * any list. Uploading, matching and removing stay with the platforms that offer them.
 */
export function ProviderCloudPage() {
  const { t } = useTranslation();
  const { isLoggedIn } = useActiveAccount();
  const query = useProviderCloudQuery();
  const tracks = useMemo(() => (query.data ?? []).map((entry) => entry.track), [query.data]);
  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (query.isLoading) return null;
    return {
      cover: CLOUD_SONG_FALLBACK_COVER,
      createTime: "",
      creator: "",
      creatorAvatar: "",
      creatorID: null,
      isSpecial: true,
      likes: "",
      privacy: t("library.cloud.meta"),
      tags: [],
      title: t("library.title.cloud"),
      totalSongs: tracks.length,
    };
  }, [query.isLoading, t, tracks.length]);

  if (!isLoggedIn) {
    return (
      <LibraryStatePage>
        <QuietState icon={Cloud} title={t("library.loggedOut.cloud")} />
      </LibraryStatePage>
    );
  }
  if (query.isError) {
    return (
      <LibraryErrorPage isRetrying={query.isRefetching} onRetry={() => void query.refetch()} />
    );
  }

  return (
    <PlaylistContent
      contentSlot={
        tracks.length === 0
          ? () => (
              <QuietState
                icon={Cloud}
                title={t("library.empty.cloud.title")}
                description={t("library.empty.cloud.description")}
              />
            )
          : undefined
      }
      dailyDate={null}
      isDailyRecommend={false}
      isLoading={query.isLoading}
      playlistId={null}
      playlistInfo={playlistInfo}
      playSourceId="library:cloud"
      refetchTracks={query.refetch}
      themeColor="var(--scopify-page-accent-cloud)"
      tracks={tracks}
    />
  );
}
