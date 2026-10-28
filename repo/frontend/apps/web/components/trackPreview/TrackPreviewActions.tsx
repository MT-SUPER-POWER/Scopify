"use client";

import { Heart, Link2, ListPlus, MonitorPlay, Play } from "lucide-react";
import { toast } from "sonner";
import { useSongLikeMutation } from "@/hooks/playlist/useSongLikeMutation";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { TrackPreviewActionsProps } from "@/types/player/trackPreviewComponents";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

const ACTION_BTN =
  "flex size-11 items-center justify-center rounded-full text-white/85 transition-all hover:scale-110 hover:bg-white/10 hover:text-white";

/** 预览弹窗右侧的竖排操作：播放这首、加入队列、喜欢、复制链接、打开 MV 页。 */
export function TrackPreviewActions({
  song,
  songs,
  playlistId,
  onClose,
}: TrackPreviewActionsProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const likeMutation = useSongLikeMutation();
  const isLiked = useUserStore((state) => state.likeListIDs.includes(song.id));

  const actions = [
    {
      key: "play",
      icon: <Play className="size-5 fill-current" />,
      label: t("trackPreview.playSong"),
      onClick: () => {
        void usePlayerStore.getState().playFromSong(song, songs, playlistId);
        onClose();
      },
    },
    {
      key: "queue",
      icon: <ListPlus className="size-5" />,
      label: t("contextMenu.addToQueue"),
      onClick: () => {
        const player = usePlayerStore.getState();
        if (player.queue.some((item) => item.id === song.id)) {
          toast.info(t("trackPreview.queueExists"));
          return;
        }
        player.appendQueueItems([song]);
        toast.success(t("trackPreview.queueAdded"));
      },
    },
    {
      key: "like",
      icon: <Heart className={cn("size-5", isLiked && "fill-current text-brand")} />,
      label: t(isLiked ? "common.action.unlike" : "common.action.like"),
      onClick: () => likeMutation.mutate({ like: !isLiked, songId: song.id }),
    },
    {
      key: "link",
      icon: <Link2 className="size-5" />,
      label: t("mv.action.copyLink"),
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}/mv?id=${song.mv}`);
          toast.success(t("mv.toast.linkCopied"));
        } catch {
          toast.error(t("common.message.requestFailed", { message: "" }));
        }
      },
    },
    {
      key: "mv",
      icon: <MonitorPlay className="size-5" />,
      label: t("trackPreview.openMv"),
      onClick: () => {
        onClose();
        void smartRouter.push(`/mv?id=${song.mv}`);
      },
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-2">
        {actions.map((action) => (
          <Tooltip key={action.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={action.label}
                onClick={() => void action.onClick()}
                className={ACTION_BTN}
              >
                {action.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              {action.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
