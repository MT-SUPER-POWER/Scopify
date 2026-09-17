import { useId } from "react";
import type { AppearanceRangeProps } from "@/types/appearance";

export function AppearanceRange({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: AppearanceRangeProps) {
  const id = useId();
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <label htmlFor={id} className="text-base font-medium text-foreground">
        {label}
      </label>
      <div className="flex min-w-40 flex-1 items-center gap-4 sm:max-w-[60%]">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={`${value}${unit}`}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-1 w-full cursor-pointer accent-brand"
        />
        <output
          htmlFor={id}
          className="w-16 shrink-0 text-right text-sm text-foreground tabular-nums"
        >
          {value}
          {unit}
        </output>
      </div>
    </div>
  );
}
