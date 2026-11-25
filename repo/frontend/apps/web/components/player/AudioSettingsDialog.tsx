"use client";

import { SlidersHorizontal, Waves, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { AudioEffectsModal } from "@/components/player/AudioEffectsModal";
import { AudioQualityDialog } from "@/components/player/AudioQualityDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import type { AudioSettingsDialogProps } from "@/types/audio/settingsDialogComponents";

export function AudioSettingsDialog({ children }: AudioSettingsDialogProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const surface = useAudioEqualizerStore((state) => state.settingsSurface);
  const setSurface = useAudioEqualizerStore((state) => state.setSettingsSurface);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Popover
        open={surface === "quality"}
        onOpenChange={(open) => {
          if (open) setSurface("quality");
          else if (useAudioEqualizerStore.getState().settingsSurface === "quality")
            setSurface(null);
        }}
      >
        <PopoverTrigger ref={trigger} asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="top"
          sideOffset={10}
          collisionPadding={16}
          aria-label={t("audioSettings.title")}
          className="w-md max-w-[calc(100vw-2rem)] overflow-hidden border bg-popover p-0 text-popover-foreground shadow-floating"
          onCloseAutoFocus={(event) => {
            if (useAudioEqualizerStore.getState().settingsSurface === "equalizer") {
              event.preventDefault();
            }
          }}
        >
          <div className="flex items-center gap-2 px-4 pt-3">
            <div className="grid flex-1 grid-cols-2 rounded-lg bg-muted/60 p-0.5">
              <span className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-popover text-xs font-medium text-foreground shadow-sm">
                <Waves className="size-3.5" />
                {t("audioSettings.qualityTab")}
              </span>
              <button
                type="button"
                aria-haspopup="dialog"
                className="flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setSurface("equalizer")}
              >
                <SlidersHorizontal className="size-3.5" />
                {t("audioSettings.equalizerTab")}
              </button>
            </div>
            <button
              type="button"
              aria-label={t("ui.close")}
              className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setSurface(null)}
            >
              <X className="size-4" />
            </button>
          </div>
          <ScrollArea
            className="min-h-0 overflow-hidden"
            viewportClassName="h-auto max-h-[min(34rem,calc(80dvh-3rem),calc(var(--radix-popover-content-available-height)-3rem))] overscroll-contain"
          >
            <div className="min-w-0 px-4 py-3">
              <AudioQualityDialog />
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <AudioEffectsModal
        open={surface === "equalizer"}
        onOpenChange={(open) => {
          if (!open && useAudioEqualizerStore.getState().settingsSurface === "equalizer") {
            setSurface(null);
          }
        }}
        daylight={resolvedTheme === "light"}
        returnFocusRef={trigger}
      />
    </>
  );
}
