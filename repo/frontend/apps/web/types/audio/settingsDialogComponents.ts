import type { ReactNode, RefObject } from "react";
import type { FoliaPanelColors } from "@scopify/ui/scopify/components/folia-panel/tokens";

export interface AudioSettingsDialogProps {
  children: ReactNode;
}

export interface AudioEffectsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  daylight: boolean;
  colors?: FoliaPanelColors;
  returnFocusRef?: RefObject<HTMLElement | null>;
}
