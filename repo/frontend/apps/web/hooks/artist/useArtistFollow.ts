"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useArtistFollowCountQuery } from "@/hooks/artist/useArtistQueries";
import { subscribeArtist } from "@/lib/api/artist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { ArtistFollowCountResponse } from "@/types/api/artist";

/** 艺人关注状态、粉丝数与关注切换；歌手页与正在播放面板共用。 */
export function useArtistFollow(artistId: number | string) {
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const isLoggedIn = useLoginStatus();

  const followCountQuery = useArtistFollowCountQuery(String(artistId));
  const followedArtists = useUserStore((s) => s.followedArtists);

  const serverIsFollowing = Boolean(
    followCountQuery.data?.data?.isFollow ?? followCountQuery.data?.data?.follow,
  );
  const localIsFollowing = useMemo(
    () => followedArtists.some((a) => String(a.id) === String(artistId)),
    [followedArtists, artistId],
  );

  const isFollowing = useMemo(() => {
    if (!isLoggedIn) return false;
    if (followCountQuery.isSuccess) {
      return serverIsFollowing;
    }
    return localIsFollowing;
  }, [isLoggedIn, followCountQuery.isSuccess, serverIsFollowing, localIsFollowing]);

  const isFollowStatusLoading = loading || (isLoggedIn && followCountQuery.isLoading);

  const toggleFollow = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error(t("login.required.toast"));
      return;
    }
    setLoading(true);
    try {
      const next = !isFollowing;
      await subscribeArtist(artistId, next);

      queryClient.setQueryData<ArtistFollowCountResponse>(
        musicQueryKeys.artist.followCount(String(artistId)),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              isFollow: next,
              follow: next,
              fansCnt: next
                ? (old.data.fansCnt ?? 0) + 1
                : Math.max(0, (old.data.fansCnt ?? 0) - 1),
            },
          };
        },
      );

      // 更新本地 store
      const store = useUserStore.getState();
      if (next) {
        store.setFollowedArtists([
          ...store.followedArtists,
          { id: Number(artistId), name: "", avatarUrl: "" },
        ]);
        toast.success(t("artist.action.following"));
      } else {
        store.setFollowedArtists(
          store.followedArtists.filter((a) => String(a.id) !== String(artistId)),
        );
        toast(t("artist.action.unfollow"));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["library", "collection"] }),
        queryClient.invalidateQueries({ queryKey: ["artist", "follow-count", String(artistId)] }),
        queryClient.invalidateQueries({ queryKey: ["home", "followed-artists"] }),
      ]);
    } catch {
      toast.error(t("common.message.requestFailed", { message: "" }));
    } finally {
      setLoading(false);
    }
  }, [artistId, isFollowing, isLoggedIn, queryClient, t]);

  return {
    fansCount: followCountQuery.data?.data?.fansCnt,
    isFollowStatusLoading,
    isFollowing,
    toggleFollow,
  };
}
