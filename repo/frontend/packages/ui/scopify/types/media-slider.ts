import type {
  ProgressRangeMarker,
  ProgressRangeMarkerAppearance,
} from "@scopify/ui/scopify/components/progress-range-markers";

export interface MediaSliderProps {
  ariaLabel?: string;
  ariaValueText?: string;
  bufferedColor?: string;
  bufferedValue?: number;
  className?: string;
  disabled?: boolean;
  fillColor?: string;
  hoverFillColor?: string;
  markerAppearance?: ProgressRangeMarkerAppearance;
  markerColor?: string;
  onChange: (value: number, isCommit: boolean) => void;
  orientation?: "horizontal" | "vertical";
  rangeMarkers?: readonly ProgressRangeMarker[];
  showThumb?: boolean;
  size?: number | string;
  thumbColor?: string;
  thumbOnHover?: boolean;
  thumbSize?: number;
  trackColor?: string;
  trackThickness?: number;
  value: number;
}
