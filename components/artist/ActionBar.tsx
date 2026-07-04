import { MoreHorizontal, Pause, Play } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
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
      // 触发侧边栏刷新
      if (store.triggerLibraryUpdate) store.triggerLibraryUpdate();
    } catch {
      toast.error(t("common.message.requestFailed", { message: "" }));
    } finally {
      setLoading(false);
    }
  }, [artistId, isFollowing, isLoggedIn, t]);

  return (
    <div className="flex items-center gap-6 p-6 md:p-8">
      <button
        type="button"
        onClick={onPlayArtist}
        disabled={disabled}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1DB954] shadow-lg shadow-black/40 transition-all hover:scale-105 hover:bg-[#1ed760] disabled:opacity-50"
      >
        {isPlayingArtist ? (
          <Pause className="h-6 w-6 fill-black text-black" />
        ) : (
          <Play className="ml-1 h-6 w-6 fill-black text-black" />
        )}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={handleToggleFollow}
        className={`group w-24 rounded-full border px-4 py-1.5 text-sm font-bold tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 ${
          isFollowing
            ? "border-white text-white hover:border-red-400 hover:text-red-400"
            : "border-gray-400 text-white hover:border-white"
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

      <button type="button" className="text-gray-400 transition-colors hover:text-white">
        <MoreHorizontal className="h-8 w-8" />
      </button>
    </div>
  );
}
