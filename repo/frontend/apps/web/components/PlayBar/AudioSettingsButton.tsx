"use client";

import { Radio } from "lucide-react";
import { AudioSettingsDialog } from "@/components/player/AudioSettingsDialog";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { useI18n } from "@/store/module/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

export function AudioSettingsButton() {
  const { t } = useI18n();
  const { musicQuality } = useMusicQuality();
  const currentOption = QUALITY_OPTIONS.find((opt) => opt.value === musicQuality);
  const CurrentIcon = currentOption?.icon ?? Radio;

  return (
    <TooltipProvider>
      <Tooltip>
        <AudioSettingsDialog>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("audioSettings.open")}
              className="flex cursor-pointer items-center justify-center transition-colors hover:text-content"
            >
              <CurrentIcon className="size-4 lg:size-5" />
            </button>
          </TooltipTrigger>
        </AudioSettingsDialog>
        <TooltipContent side="top" sideOffset={8}>
          <ShortcutHint commandId="toggle-audio-settings" label={t("audioSettings.title")} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
