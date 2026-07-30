import type { ProgressRangeMarkersProps } from "@/types/components/slider";

export function ProgressRangeMarkers({
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

    return (
      <span
        aria-hidden
        key={`${startPercent}-${endPercent}-${index}`}
        className="pointer-events-none absolute z-10"
        style={{
          ...(isVertical
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
              }),
        }}
      >
        <span
          className="absolute inset-0 rounded-full opacity-35"
          style={{ backgroundColor: color }}
        />
        <span
          className="absolute size-2 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 6px ${color}`,
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
