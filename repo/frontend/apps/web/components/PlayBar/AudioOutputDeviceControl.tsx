"use client";

import { MonitorSpeaker } from "lucide-react";
import { AudioOutputDevicePanel } from "@/components/player/AudioOutputDevicePanel";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAudioOutputStore } from "@/store/module/audioOutput";
import { useI18n } from "@/store/module/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

export function AudioOutputDeviceControl() {
  const { t } = useI18n();
  const isPopoverOpen = useAudioOutputStore((state) => state.isPopoverOpen);
  const setPopoverOpen = useAudioOutputStore((state) => state.setPopoverOpen);

  return (
    <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
      <TooltipProvider>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("audioSettings.outputTitle")}
                className={`flex items-center justify-center transition-colors hover:text-content ${
                  isPopoverOpen ? "text-brand" : ""
                }`}
              >
                <MonitorSpeaker className="size-4 lg:size-5" />
              </button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <ShortcutHint
              commandId="toggle-audio-output-device"
              label={t("audioSettings.outputTitle")}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={10}
        className="z-2000 w-80 space-y-3 p-4 shadow-floating"
      >
        <h3 className="text-sm font-semibold">{t("audioSettings.outputTitle")}</h3>
        <AudioOutputDevicePanel />
      </PopoverContent>
    </Popover>
  );
}
