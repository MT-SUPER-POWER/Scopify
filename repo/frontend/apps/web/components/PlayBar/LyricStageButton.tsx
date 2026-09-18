"use client";

import { Mic2 } from "lucide-react";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

export function LyricStageButton() {
  const { t } = useI18n();
  const isLyricsOpen = useUiStore((s) => s.isLyricsOpen);
  const toggleLyrics = useUiStore((s) => s.toggleLyrics);
  const lyricsActionLabel = t(isLyricsOpen ? "ui.hideLyrics" : "ui.showLyrics");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => toggleLyrics()}
            aria-label={lyricsActionLabel}
            className={`transition-colors hover:text-content ${isLyricsOpen ? "text-brand" : ""}`}
          >
            <Mic2 className="size-4 lg:size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          <ShortcutHint commandId="toggle-lyric-stage" label={lyricsActionLabel} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
