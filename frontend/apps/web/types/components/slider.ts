export interface ProgressRangeMarker {
  endPercent: number;
  startPercent: number;
}

export interface ProgressRangeMarkersProps {
  color: string;
  orientation?: "horizontal" | "vertical";
  ranges: readonly ProgressRangeMarker[];
}

export interface SmoothSliderProps {
  value: number;
  bufferedValue?: number;
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
  markerColor?: string;
  className?: string;
}
