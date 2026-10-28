export interface ProgressRangeMarker {
  endPercent: number;
  startPercent: number;
}

export type ProgressRangeMarkerAppearance = "glow" | "pin";

export interface ProgressRangeMarkersProps {
  appearance?: ProgressRangeMarkerAppearance;
  color: string;
  orientation?: "horizontal" | "vertical";
  ranges: readonly ProgressRangeMarker[];
}

export interface SmoothSliderProps {
  ariaLabel?: string;
  ariaValueText?: string;
  value: number;
  bufferedValue?: number;
  disabled?: boolean;
  onChange: (value: number, isCommit: boolean) => void;
  orientation?: "horizontal" | "vertical";
  size?: number | string;
  trackColor?: string;
  bufferedColor?: string;
  fillColor?: string;
  thumbColor?: string;
  hoverFillColor?: string;
  showThumb?: boolean;
  thumbOnHover?: boolean;
  trackThickness?: number;
  thumbSize?: number;
  rangeMarkers?: readonly ProgressRangeMarker[];
  markerAppearance?: ProgressRangeMarkerAppearance;
  markerColor?: string;
  className?: string;
}
