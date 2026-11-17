"use client";

import { Popover, PopoverAnchor, PopoverContent } from "@scopify/ui/shadcn/components/popover";
import { Volume2, VolumeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SmoothSlider } from "@/components/shared/SmoothSlider";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import type { FoliaCapsuleVolumeProps } from "@/types/player/foliaControls";

export function FoliaCapsuleVolume({ anchor, onClose, onToggleMute }: FoliaCapsuleVolumeProps) {
  const { t } = useTranslation();
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const [preview, setPreview] = useState<number | null>(null);
  const volume = preview ?? playback.volume;
  const muteLabel = t(playback.volume > 0 ? "folia.ui.mute" : "ui.unmute");
  const virtualRef = useMemo(
    () => ({
      current: { getBoundingClientRect: () => new DOMRect(anchor.x, anchor.y, 0, 0) },
    }),
    [anchor.x, anchor.y],
  );

  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        aria-label={t("folia.ui.volume")}
        side="bottom"
        sideOffset={-22}
        collisionPadding={8}
        data-shortcut-scope="volume"
        className="z-160 flex h-11 w-64 max-w-[calc(100vw-1rem)] items-center gap-2 rounded-full px-3 py-0 shadow-floating"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (anchor.trigger.isConnected) anchor.trigger.focus({ preventScroll: true });
        }}
      >
        <button
          type="button"
          className="grid size-6 shrink-0 place-items-center rounded-full text-content-muted hover:text-content"
          title={muteLabel}
          aria-label={muteLabel}
          onClick={onToggleMute}
        >
          {playback.volume === 0 ? (
            <VolumeOff className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </button>
        <SmoothSlider
          ariaLabel={t("folia.ui.volume")}
          ariaValueText={`${Math.round(volume)}%`}
          className="flex-1"
          trackThickness={4}
          thumbSize={10}
          value={volume}
          onChange={(value, isCommit) => {
            setPreview(isCommit ? null : value);
            if (isCommit) void commands.setVolume(Math.round(value));
          }}
        />
        <span className="w-9 shrink-0 text-right text-xs tabular-nums">{Math.round(volume)}%</span>
      </PopoverContent>
    </Popover>
  );
}
