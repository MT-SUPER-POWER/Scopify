"use client";

import { useTheme } from "next-themes";

import { AudioEffectsModal } from "@/components/player/AudioEffectsModal";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import type { AudioSettingsDialogProps } from "@/types/audio/settingsDialogComponents";

export function AudioSettingsDialog({ children }: AudioSettingsDialogProps) {
  const { resolvedTheme } = useTheme();
  const open = useAudioEqualizerStore((state) => state.isDialogOpen);
  const active = useAudioEqualizerStore((state) => state.dialogTab);
  const closeDialog = useAudioEqualizerStore((state) => state.closeDialog);
  const openDialog = useAudioEqualizerStore((state) => state.openDialog);
  const setTab = useAudioEqualizerStore((state) => state.setDialogTab);

  return (
    <AudioEffectsModal
      open={open}
      onOpenChange={(next) => {
        if (next) openDialog("quality");
        else closeDialog();
      }}
      daylight={resolvedTheme === "light"}
      trigger={children}
      tabs={{ active, onChange: setTab }}
    />
  );
}
