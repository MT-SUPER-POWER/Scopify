"use client";

import { ChevronLeft } from "lucide-react";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

/** 正在播放面板折叠后的窄条内容，整条可点击展开。 */
export function NowPlayingCollapsedRail() {
  const { t } = useI18n();
  const setIsOpen = useUiStore((s) => s.setIsNowPlayingPanelOpen);
  const label = t("nowPlaying.show");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={label}
            className="group flex size-full items-center justify-center rounded-lg bg-surface-sunken text-content-muted transition-colors hover:bg-surface-elevated hover:text-content"
          >
            <ChevronLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>
          <ShortcutHint commandId="toggle-now-playing-panel" label={label} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
