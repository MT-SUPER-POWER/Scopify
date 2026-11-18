"use client";

import type { MusicArtistDetail, MusicArtistFollowState } from "@scopify/music-domain/artist";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useArtistFollowStateQuery } from "@/hooks/artist/useArtistQueries";
import { useLibraryAccount } from "@/hooks/library/useLibraryAccount";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";

/** 艺人关注状态、粉丝数与关注切换；歌手页与正在播放面板共用。 */
export function useArtistFollow(artistId: number | string) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { account, provider } = useLibraryAccount();
  const id = String(artistId);

  const followStateQuery = useArtistFollowStateQuery(id);
  // NetEase mirrors the artists the account follows into the user store.
  const followedArtists = useUserStore((s) => s.followedArtists);

  const localIsFollowing = useMemo(
    () => followedArtists.some((a) => String(a.id) === id),
    [followedArtists, id],
  );

  const isFollowing = useMemo(() => {
    if (!account) return false;
    if (followStateQuery.isSuccess) return followStateQuery.data.followed;
    return localIsFollowing;
  }, [account, followStateQuery.data, followStateQuery.isSuccess, localIsFollowing]);

  const isFollowStatusLoading = loading || (account !== null && followStateQuery.isLoading);

  const toggleFollow = useCallback(async () => {
    if (!account) {
      toast.error(t("login.required.toast"));
      return;
    }
    if (!provider.setArtistFollowed) return;
    setLoading(true);
    try {
      const next = !isFollowing;
      await provider.setArtistFollowed({ provider: provider.provider, kind: "artist", id }, next);

      const delta = next ? 1 : -1;
      const adjustCount = (count: number | null) =>
        count === null ? null : Math.max(0, count + delta);
      queryClient.setQueryData<MusicArtistFollowState>(
        musicQueryKeys.artist.followState(provider.provider, account.accountId, id),
        (old) => (old ? { followed: next, followerCount: adjustCount(old.followerCount) } : old),
      );
      queryClient.setQueryData<MusicArtistDetail>(
        musicQueryKeys.artist.detail(provider.provider, id),
        (old) => (old ? { ...old, followerCount: adjustCount(old.followerCount) } : old),
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
        store.setFollowedArtists(store.followedArtists.filter((a) => String(a.id) !== id));
        toast(t("artist.action.unfollow"));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["library", "collection"] }),
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.artist.followStateAll(provider.provider),
        }),
        queryClient.invalidateQueries({ queryKey: ["home", "followed-artists"] }),
      ]);
    } catch {
      toast.error(t("common.message.requestFailed", { message: "" }));
    } finally {
      setLoading(false);
    }
  }, [account, artistId, id, isFollowing, provider, queryClient, t]);

  return {
    fansCount: followStateQuery.data?.followerCount ?? undefined,
    isFollowStatusLoading,
    isFollowing,
    toggleFollow,
  };
}
