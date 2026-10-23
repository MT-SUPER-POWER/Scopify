import type { ReactNode } from "react";
import type { FoliaPictureState } from "@scopify/ui/scopify/components/folia-panel/picture-grid";

export interface FoliaModeStepperRowProps<Value extends string> {
  value: Value;
  options: ReadonlyArray<{ value: Value; label: string }>;
  onSelect: (value: Value) => void;
  onStep: (direction: -1 | 1) => void;
  /** Draws a mode's glyph, the row's own sign of the chosen mode. */
  renderGlyph: (value: Value) => ReactNode;
  /** Draws a mode's picture in the open picker; the same function each time. */
  renderPicture: (value: Value, state: FoliaPictureState) => ReactNode;
  /** The small line over the mode's name, and the row's accessible name. */
  caption: string;
  /** Accessible names of the previous / next arrows. */
  stepLabels: { previous: string; next: string };
  /** One parameter right of the button, before the next arrow (e.g. animation intensity). */
  aside?: ReactNode;
  /** Complete mode-specific controls, revealed in a popover by default. */
  params?: ReactNode;
  /** Nested popover triggers (such as the random pool) stay on the main row. */
  inlineParams?: boolean;
  moreLabel: string;
  onOpenMore: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
