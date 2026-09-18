"use client";

import { Button } from "@scopify/ui/shadcn/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@scopify/ui/shadcn/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";
import { MoreHorizontal, Pause, Play, RotateCcw } from "lucide-react";
import { useSubtitlePreviewPlaying } from "@/hooks/settings/useSubtitlePreviewPlaying";
import { useI18n } from "@/store/module/i18n";
import type { SubtitlePlaybackControlsProps } from "@/types/subtitle-preview";

export function SubtitlePlaybackControls({
  playback,
  duration,
  loop,
  onTogglePlayback,
  onReplay,
  visible,
  onVisibleChange,
  onLoopChange,
}: SubtitlePlaybackControlsProps) {
  const { t } = useI18n();
  const playing = useSubtitlePreviewPlaying(playback, duration, loop);
  const playbackLabel = t(playing ? "subtitleSystem.pause" : "subtitleSystem.play");
  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={playbackLabel}
              disabled={!visible}
              onClick={onTogglePlayback}
            >
              {playing ? (
                <Pause aria-hidden="true" fill="currentColor" strokeWidth={0} />
              ) : (
                <Play aria-hidden="true" fill="currentColor" strokeWidth={0} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{playbackLabel}</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("subtitlePreview.options")}
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{t("subtitlePreview.options")}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onReplay}>
              <RotateCcw aria-hidden="true" />
              {t("subtitlePreview.replay")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={loop} onCheckedChange={onLoopChange}>
              {t("subtitlePreview.loop")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={visible} onCheckedChange={onVisibleChange}>
              {t("subtitlePreview.visible")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}
