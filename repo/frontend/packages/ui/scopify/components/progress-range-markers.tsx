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

/** Visual range overlays for horizontal or vertical media progress tracks. */
export function ProgressRangeMarkers({
  appearance = "pin",
  color,
  orientation = "horizontal",
  ranges,
}: ProgressRangeMarkersProps) {
  const isVertical = orientation === "vertical";

  return ranges.map((range, index) => {
    const startPercent = Math.max(0, Math.min(100, range.startPercent));
    const endPercent = Math.max(startPercent, Math.min(100, range.endPercent));
    const rangePercent = endPercent - startPercent;
    if (rangePercent <= 0) return null;

    const markerBounds = isVertical
      ? {
          bottom: `${startPercent}%`,
          height: `${rangePercent}%`,
          left: 0,
          width: "100%",
        }
      : {
          height: "100%",
          left: `${startPercent}%`,
          top: 0,
          width: `${rangePercent}%`,
        };

    if (appearance === "glow") {
      return (
        <span
          aria-hidden
          key={`${startPercent}-${endPercent}-${index}`}
          className="pointer-events-none absolute z-10"
          style={markerBounds}
        >
          <span
            className="absolute rounded-full opacity-30 blur-[2px]"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
              ...(isVertical
                ? {
                    height: "100%",
                    left: "50%",
                    top: 0,
                    transform: "translateX(-50%)",
                    width: 8,
                  }
                : {
                    height: 8,
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "100%",
                  }),
            }}
          />
        </span>
      );
    }

    return (
      <span
        aria-hidden
        key={`${startPercent}-${endPercent}-${index}`}
        className="pointer-events-none absolute z-10"
        style={markerBounds}
      >
        <span
          className="absolute inset-0 rounded-full opacity-35"
          style={{ backgroundColor: color }}
        />
        <span
          className="absolute size-2 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 0 1px var(--color-background), 0 0 6px ${color}`,
            ...(isVertical
              ? {
                  bottom: 0,
                  left: "50%",
                  transform: "translate(-50%, 50%)",
                }
              : {
                  left: 0,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }),
          }}
        />
      </span>
    );
  });
}
