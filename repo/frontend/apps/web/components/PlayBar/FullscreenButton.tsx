"use client";

import { Expand, MinimizeIcon } from "lucide-react";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { toggleApplicationFullscreen } from "@/lib/shortcuts/fullscreen";
import { useTranslation } from "react-i18next";

import { useUiStore } from "@/store/module/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

export function FullscreenButton() {
  const { t } = useTranslation();
  const isFullscreen = useUiStore((s) => s.isFullscreen);
  const fullscreenActionLabel = t(isFullscreen ? "ui.exitFullscreen" : "ui.fullscreen");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={fullscreenActionLabel}
            onClick={() => void toggleApplicationFullscreen()}
            className="hidden transition-colors hover:text-content sm:block"
          >
            {isFullscreen ? (
              <MinimizeIcon className="size-4 lg:size-5" />
            ) : (
              <Expand className="size-4 lg:size-5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          <ShortcutHint commandId="toggle-fullscreen" label={fullscreenActionLabel} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
