"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { TrackPreviewDialog } from "./TrackPreviewDialog";
import { MvCardPreview } from "@/components/mv/MvCardPreview";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { TrackPreviewButtonProps } from "@/types/components/trackPreview";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

/**
 * 播放按钮旁的竖版预览入口（参考 Spotify 歌单的 Canvas 预览）：列表里有带 MV 的歌曲时才出现，
 * 悬停时在小窗里静音预览第一首，点击打开逐首预览的弹窗。
 */
export function TrackPreviewButton({
  tracks,
  title,
  tags = [],
  playlistId = null,
  className,
}: TrackPreviewButtonProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const videoTracks = useMemo(() => tracks.filter((track) => (track.mv ?? 0) > 0), [tracks]);
  const first = videoTracks[0];

  if (!first) return null;

  const artworkUrl = resolveCoverUrl(first.al?.picUrl, first.al?.coverUrl);
  const label = t("trackPreview.open");

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={label}
              onClick={() => setIsOpen(true)}
              onPointerEnter={() => setIsHovering(true)}
              onPointerLeave={() => setIsHovering(false)}
              className={cn(
                "relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-elevated ring-2 ring-content/15 transition-all hover:scale-105 hover:ring-content/40",
                className,
              )}
            >
              {artworkUrl && (
                <Image
                  fill
                  sizes="40px"
                  src={getSizedImageUrl(artworkUrl, 120)}
                  alt=""
                  className="object-cover"
                />
              )}
              {isHovering && first.mv ? <MvCardPreview mvid={first.mv} /> : null}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            {t("trackPreview.openWithCount", { count: videoTracks.length })}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isOpen && (
        <TrackPreviewDialog
          open
          onOpenChange={setIsOpen}
          title={title}
          tags={tags}
          tracks={videoTracks}
          allTracks={tracks}
          playlistId={playlistId}
        />
      )}
    </>
  );
}
