import { Copy, MoreHorizontal, Pause, Play, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { subscribeArtist } from "@/lib/api/artist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useArtistFollowCountQuery } from "@/hooks/artist/useArtistQueries";
import { useArtistFansGroupStatus } from "@/hooks/fansGroup/useFansGroupQueries";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { ArtistFollowCountResponse } from "@/types/api/artist";

interface Props {
  artistId: number | string;
  isPlayingArtist: boolean;
  disabled: boolean;
  onPlayArtist: () => void;
}

export function ActionBar({ artistId, isPlayingArtist, disabled, onPlayArtist }: Props) {
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

  const fansGroupStatus = useArtistFansGroupStatus(artistId);

  const handleToggleFollow = useCallback(async () => {
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

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/artist?id=${artistId}`);
      toast.success(t("artist.track.copySuccess"));
    } catch {
      toast.error(t("artist.track.copyFailed"));
    }
  }, [artistId, t]);

  return (
    <div className="flex items-center gap-6 p-6 md:p-8">
      <button
        type="button"
        onClick={onPlayArtist}
        disabled={disabled}
        className="flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand transition-all hover:scale-105 hover:bg-brand-hover disabled:opacity-50"
      >
        {isPlayingArtist ? (
          <Pause className="size-6 fill-current" />
        ) : (
          <Play className="ml-1 size-6 fill-current" />
        )}
      </button>

      <button
        type="button"
        disabled={isFollowStatusLoading}
        onClick={handleToggleFollow}
        className={`group w-24 rounded-full border px-4 py-1.5 text-sm font-bold tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 ${
          isFollowing
            ? "border-content text-content hover:border-danger hover:text-danger"
            : "border-content-muted text-content hover:border-content"
        } `}
      >
        <span className="group-hover:hidden">
          {isFollowStatusLoading
            ? t("common.status.loading")
            : isFollowing
              ? t("artist.action.following")
              : t("artist.action.follow")}
        </span>
        <span className="hidden group-hover:inline">
          {isFollowStatusLoading
            ? t("common.status.loading")
            : isFollowing
              ? t("artist.action.unfollow")
              : t("artist.action.follow")}
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="text-content-muted transition-colors hover:text-content focus:outline-none"
            aria-label={t("social.more")}
          >
            <MoreHorizontal className="size-8" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {fansGroupStatus.isJoined && fansGroupStatus.fansGroupId && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href={`/social?group=${fansGroupStatus.fansGroupId}`}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users className="size-4" />
                    <span>{t("artist.action.fansGroup")}</span>
                  </div>
                  {fansGroupStatus.level && (
                    <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] font-semibold text-content-muted">
                      Lv.{fansGroupStatus.level}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem className="cursor-pointer" onSelect={() => void handleCopyLink()}>
            <Copy className="size-4" />
            <span>{t("artist.action.copyLink")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
