import type { CSSProperties, ReactNode } from "react";

import type { AudioEffectControl } from "@/types/audio/equalizer";

export interface AudioEqualizerPanelProps {
  /** Overrides the theme's --primary as the accent (Folia themes). */
  accentColor?: string;
  className?: string;
  /** Styles the preset menu, which portals out of the panel's surface. */
  selectContentClassName?: string;
  selectContentStyle?: CSSProperties;
  style?: CSSProperties;
}

export interface AudioEqualizerPanelSectionProps {
  action?: ReactNode;
  children: ReactNode;
  /** Quiet text before the action, e.g. the auto headroom. */
  meta?: ReactNode;
  title: string;
}

export interface AudioEffectSliderProps {
  control: AudioEffectControl;
  label: string;
  resetLabel: string;
  value: number;
  onChange: (value: number) => void;
  onCommit: () => void;
}
