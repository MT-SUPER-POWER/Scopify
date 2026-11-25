import type { ReactNode } from "react";
import type { FoliaPanelColors } from "@scopify/ui/scopify/components/folia-panel/tokens";

import type { AudioSettingsTab } from "./equalizer";

export interface AudioSettingsDialogProps {
  children: ReactNode;
}

export interface AudioEffectsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  daylight: boolean;
  colors?: FoliaPanelColors;
  trigger?: ReactNode;
  tabs?: {
    active: AudioSettingsTab;
    onChange: (tab: AudioSettingsTab) => void;
  };
}
