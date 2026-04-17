import { MoreHorizontal, Pause, Play } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/store/module/i18n";

interface Props {
  isPlayingArtist: boolean;
  disabled: boolean;
  onPlayArtist: () => void;
}

export function ActionBar({ isPlayingArtist, disabled, onPlayArtist }: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const { t } = useI18n();

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
        onClick={() => setIsFollowing((v) => !v)}
        className={`px-4 py-1.5 rounded-full border border-gray-400 text-sm font-bold uppercase tracking-widest hover:border-white hover:scale-105 transition-all ${isFollowing ? "text-white border-white" : "text-white"}`}
      >
        {isFollowing ? t("artist.action.following") : t("artist.action.follow")}
      </button>

      <button
        type="button"
        className="text-gray-400 hover:text-white transition-colors">
        <MoreHorizontal className="w-8 h-8" />
      </button>
    </div>
  );
}
