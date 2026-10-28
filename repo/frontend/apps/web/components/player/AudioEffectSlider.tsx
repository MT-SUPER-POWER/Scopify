"use client";

import { RotateCcw } from "lucide-react";
import type { CSSProperties } from "react";

import { Slider } from "@scopify/ui/shadcn/components/slider";
import {
  AUDIO_EFFECT_SLIDER_MAX,
  formatEffectValue,
  fromEffectSliderPosition,
  toEffectSliderPosition,
} from "@/lib/player/audioEffectControls";
import { cn } from "@/lib/utils";
import type { AudioEffectSliderProps } from "@/types/audio/equalizerPanelComponents";

/** One effect: label and value on a line, a slim slider under it; the value resets when changed. */
export function AudioEffectSlider({
  control,
  label,
  resetLabel,
  value,
  onChange,
  onCommit,
}: AudioEffectSliderProps) {
  const isModified = value !== control.neutral;
  const position = toEffectSliderPosition(control, value);
  const neutralPosition = toEffectSliderPosition(control, control.neutral);
  // The range fills from the neutral point, so an untouched low-pass (neutral at max) reads empty.
  const fill = {
    "--fill-start": `${(Math.min(position, neutralPosition) / AUDIO_EFFECT_SLIDER_MAX) * 100}%`,
    "--fill-end": `${100 - (Math.max(position, neutralPosition) / AUDIO_EFFECT_SLIDER_MAX) * 100}%`,
  } as CSSProperties;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-4 items-center justify-between gap-2 text-xs">
        <span className="truncate opacity-75">{label}</span>
        <button
          type="button"
          disabled={!isModified}
          onClick={() => {
            onChange(control.neutral);
            onCommit();
          }}
          title={isModified ? resetLabel : undefined}
          className={cn(
            "group/reset flex shrink-0 items-center gap-1 rounded text-[11px] font-medium tabular-nums transition-colors",
            isModified ? "text-(--eq-accent) hover:opacity-80" : "cursor-default opacity-45",
          )}
        >
          {isModified ? (
            <RotateCcw className="size-2.5 opacity-0 transition-opacity group-hover/reset:opacity-100" />
          ) : null}
          {formatEffectValue(control, value)}
        </button>
      </div>
      <Slider
        aria-label={label}
        min={0}
        max={AUDIO_EFFECT_SLIDER_MAX}
        step={1}
        value={[position]}
        onValueChange={([next]) => onChange(fromEffectSliderPosition(control, next))}
        onValueCommit={onCommit}
        style={fill}
        className="cursor-pointer [&_[data-slot=slider-range]]:right-(--fill-end)! [&_[data-slot=slider-range]]:left-(--fill-start)! [&_[data-slot=slider-range]]:bg-(--eq-accent) [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-(--eq-accent) [&_[data-slot=slider-thumb]]:ring-(--eq-accent)/20 [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-current/10"
      />
    </div>
  );
}
