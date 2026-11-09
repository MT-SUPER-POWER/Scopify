import { Copy, MoreHorizontal, Pause, Play } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CapabilityGate } from "@/components/provider/CapabilityGate";
import { useArtistFollow } from "@/hooks/artist/useArtistFollow";
import { useTranslation } from "react-i18next";

import { ArtistFansGroupItem } from "./ArtistFansGroupItem";

interface Props {
  artistId: string;
  isPlayingArtist: boolean;
  disabled: boolean;
  onPlayArtist: () => void;
}

function FollowButton({ artistId }: { artistId: string }) {
  const { t } = useTranslation();
  const { isFollowStatusLoading, isFollowing, toggleFollow } = useArtistFollow(artistId);

  return (
    <button
      type="button"
      disabled={isFollowStatusLoading}
      onClick={() => void toggleFollow()}
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
  );
}

export function ActionBar({ artistId, isPlayingArtist, disabled, onPlayArtist }: Props) {
  const { t } = useTranslation();

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

      <CapabilityGate requires="artist.follow">
        <FollowButton artistId={artistId} />
      </CapabilityGate>

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
          <CapabilityGate requires="social">
            <ArtistFansGroupItem artistId={artistId} />
          </CapabilityGate>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => void handleCopyLink()}>
            <Copy className="size-4" />
            <span>{t("artist.action.copyLink")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
