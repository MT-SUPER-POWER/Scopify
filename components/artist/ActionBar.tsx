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
    <div className="p-6 md:p-8 flex items-center gap-6">
      <button
        type="button"
        onClick={onPlayArtist}
        disabled={disabled}
        className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center hover:scale-105 hover:bg-[#1ed760] transition-all shadow-lg shadow-black/40 disabled:opacity-50"
      >
        {isPlayingArtist ? (
          <Pause className="w-6 h-6 text-black fill-black" />
        ) : (
          <Play className="w-6 h-6 text-black fill-black ml-1" />
        )}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={handleToggleFollow}
        className={`
          px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-widest
          hover:scale-105 transition-all disabled:opacity-50 w-24
          group
          ${
            isFollowing
              ? "border-white text-white hover:border-red-400 hover:text-red-400"
              : "border-gray-400 text-white hover:border-white"
          }
        `}
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

      <button type="button" className="text-gray-400 hover:text-white transition-colors">
        <MoreHorizontal className="w-8 h-8" />
      </button>
    </div>
  );
}
