"use client";

import { PanelRight } from "lucide-react";
import { useNowPlayingPanelVisibility } from "@/hooks/ui/useNowPlayingPanelVisibility";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

/** 播放栏右侧的正在播放面板开关；窗口过窄放不下面板时隐藏。 */
export function NowPlayingPanelButton() {
  const { t } = useI18n();
  const toggle = useUiStore((s) => s.toggleNowPlayingPanel);
  const { canShow, isOpen } = useNowPlayingPanelVisibility();
  const label = t(isOpen ? "nowPlaying.hide" : "nowPlaying.show");

  if (!canShow) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggle}
            aria-label={label}
            aria-pressed={isOpen}
            className={cn("transition-colors hover:text-content", isOpen && "text-brand")}
          >
            <PanelRight className="size-4 lg:size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
