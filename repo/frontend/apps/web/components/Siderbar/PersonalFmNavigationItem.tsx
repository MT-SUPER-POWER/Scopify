"use client";

import { Loader2, RadioTower } from "lucide-react";
import { toast } from "sonner";

import { PlayingAnimation } from "@/components/shared/PlayingAnimation";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import { useUiStore } from "@/store/module/ui";

interface PersonalFmNavigationItemProps {
  isCollapsed: boolean;
}

export function PersonalFmNavigationItem({ isCollapsed }: PersonalFmNavigationItemProps) {
  const { t } = useI18n();
  const requireLogin = useRequireLoginAction();
  const isLoading = usePersonalFmStore((state) => state.status === "loading");
  const isCurrentSource = usePlayerStore((state) => isPersonalFmPlaybackSource(state.playlistId));
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isFmPlaying = isCurrentSource && isPlaying;
  const label = t("personalFm.title");

  const startPersonalFm = () =>
    requireLogin(async () => {
      const started = await usePersonalFmStore.getState().start();
      if (!started) {
        toast.error(usePersonalFmStore.getState().error ?? t("personalFm.error.loadFailed"));
        return;
      }
      useUiStore.getState().setIsLyricsOpen(true);
    });

  if (isCollapsed) {
    return (
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={isCurrentSource}
        disabled={isLoading}
        onClick={() => void startPersonalFm()}
        className={cn(
          "group flex size-12 items-center justify-center rounded-md transition-colors disabled:cursor-wait",
          isCurrentSource
            ? "bg-content/5 text-brand hover:bg-content/10"
            : "bg-content/5 text-content-muted hover:bg-content/10 hover:text-content",
        )}
      >
        {isLoading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : isFmPlaying ? (
          <PlayingAnimation size={18} />
        ) : (
          <RadioTower className={cn("size-5", isCurrentSource && "text-brand")} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={isCurrentSource}
      disabled={isLoading}
      onClick={() => void startPersonalFm()}
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-md p-2 text-left text-sm font-medium transition-colors disabled:cursor-wait",
        isCurrentSource
          ? "text-brand hover:bg-content/5"
          : "text-content-muted hover:bg-content/5 hover:text-content",
      )}
    >
      {isLoading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      ) : (
        <RadioTower className={cn("size-4 shrink-0", isCurrentSource && "text-brand")} />
      )}
      <span
        className={cn("min-w-0 flex-1 truncate", isCurrentSource && "font-semibold text-brand")}
      >
        {isLoading ? t("personalFm.status.loading") : label}
      </span>
      {isFmPlaying && <PlayingAnimation size={14} className="shrink-0" />}
    </button>
  );
}
