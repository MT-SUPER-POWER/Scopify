import { MoreHorizontal, Pause, Play } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeArtist } from "@/lib/api/artist";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

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

  const followedArtists = useUserStore((s) => s.followedArtists);
  const isFollowing = useMemo(
    () => followedArtists.some((a) => String(a.id) === String(artistId)),
    [followedArtists, artistId],
  );

  const handleToggleFollow = useCallback(async () => {
    if (!isLoggedIn) {
      toast.error(t("login.required.toast"));
      return;
    }
    setLoading(true);
    try {
      const next = !isFollowing;
      await subscribeArtist(artistId, next);
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
      ]);
    } catch {
      toast.error(t("common.message.requestFailed", { message: "" }));
    } finally {
      setLoading(false);
    }
  }, [artistId, isFollowing, isLoggedIn, queryClient, t]);

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
        disabled={loading}
        onClick={handleToggleFollow}
        className={`group w-24 rounded-full border px-4 py-1.5 text-sm font-bold tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 ${
          isFollowing
            ? "border-content text-content hover:border-danger hover:text-danger"
            : "border-content-muted text-content hover:border-content"
        } `}
      >
        <span className="group-hover:hidden">
          {loading
            ? t("common.status.loading")
            : isFollowing
              ? t("artist.action.following")
              : t("artist.action.follow")}
        </span>
        <span className="hidden group-hover:inline">
          {loading
            ? t("common.status.loading")
            : isFollowing
              ? t("artist.action.unfollow")
              : t("artist.action.follow")}
        </span>
      </button>

      <button type="button" className="text-content-muted transition-colors hover:text-content">
        <MoreHorizontal className="size-8" />
      </button>
    </div>
  );
}
