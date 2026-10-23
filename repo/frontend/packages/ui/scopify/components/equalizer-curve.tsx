"use client";

import { motion, type Transition } from "framer-motion";
import { useId, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

import { cn } from "@scopify/ui/shadcn/lib/utils";

// The multi-band equalizer view from the docs landing page (apps/docs landing-equalizer.tsx,
// landing-eq-band.tsx, lib/marketing/eq-curve.ts): vertical faders over a smooth response curve
// that springs between shapes and follows a fader instantly while it is dragged. The fill sits
// between the curve and the 0 dB line, so boosts read above it and cuts below.
// Colours: the accent is `--eq-accent` (the `accentColor` prop, else the theme's --primary); lines
// and labels follow currentColor, so the view sits on any surface.

/** The curve's coordinate system; the SVG stretches it with preserveAspectRatio="none". */
export const EQ_CURVE_WIDTH = 1000;
export const EQ_CURVE_HEIGHT = 240;

/** Gain → vertical ratio from 0 (top, +max dB) to 1 (bottom, −max dB). */
export const gainToRatio = (gain: number, maxGain: number) => (maxGain - gain) / (2 * maxGain);

const format = (value: number) => value.toFixed(2);

/**
 * A Catmull-Rom spline through the band gains. The command structure is fixed (M + bands+1 C), so
 * framer-motion can interpolate straight between two curves of the same band count.
 */
export const buildEqCurve = (gains: readonly number[], maxGain: number) => {
  const toY = (gain: number) => gainToRatio(gain, maxGain) * EQ_CURVE_HEIGHT;
  const bands = gains.map(
    (gain, index) => [((index + 0.5) / gains.length) * EQ_CURVE_WIDTH, toY(gain)] as const,
  );
  const points = [
    [0, bands[0]?.[1] ?? EQ_CURVE_HEIGHT / 2] as const,
    ...bands,
    [EQ_CURVE_WIDTH, bands.at(-1)?.[1] ?? EQ_CURVE_HEIGHT / 2] as const,
  ];

  let path = `M ${format(points[0][0])} ${format(points[0][1])}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;
    const control1 = [
      current[0] + (next[0] - previous[0]) / 6,
      current[1] + (next[1] - previous[1]) / 6,
    ];
    const control2 = [
      next[0] - (afterNext[0] - current[0]) / 6,
      next[1] - (afterNext[1] - current[1]) / 6,
    ];
    path += ` C ${format(control1[0])} ${format(control1[1])} ${format(control2[0])} ${format(control2[1])} ${format(next[0])} ${format(next[1])}`;
  }
  return path;
};

/** The area between the curve and the 0 dB line. */
export const buildEqArea = (gains: readonly number[], maxGain: number) =>
  `${buildEqCurve(gains, maxGain)} L ${EQ_CURVE_WIDTH} ${EQ_CURVE_HEIGHT / 2} L 0 ${EQ_CURVE_HEIGHT / 2} Z`;

const SPRING: Transition = { type: "spring", stiffness: 120, damping: 17, mass: 0.9 };
const INSTANT: Transition = { duration: 0 };

const KEY_STEPS: Record<string, number> = {
  ArrowUp: 1,
  ArrowRight: 1,
  ArrowDown: -1,
  ArrowLeft: -1,
};

const formatGain = (gain: number) => `${gain > 0 ? "+" : ""}${gain}`;

interface EqualizerFaderProps {
  label: string;
  gain: number;
  maxGain: number;
  step: number;
  disabled: boolean;
  transition: Transition;
  onChange: (gain: number) => void;
  onDragChange: (isDragging: boolean) => void;
  onCommit?: () => void;
}

/** One vertical band fader: drag with the pointer, or focus it and use the arrow keys. */
function EqualizerFader({
  label,
  gain,
  maxGain,
  step,
  disabled,
  transition,
  onChange,
  onDragChange,
  onCommit,
}: EqualizerFaderProps) {
  const ratio = gainToRatio(gain, maxGain);
  const fillTop = Math.min(ratio, 0.5) * 100;
  const fillHeight = Math.abs(ratio - 0.5) * 100;
  const clamp = (value: number) =>
    Math.min(maxGain, Math.max(-maxGain, Math.round(value / step) * step));

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextRatio = (event.clientY - rect.top) / rect.height;
    const next = clamp(maxGain - nextRatio * 2 * maxGain);
    if (next !== gain) onChange(next);
  };

  const release = () => {
    onDragChange(false);
    onCommit?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = KEY_STEPS[event.key];
    if (direction === undefined) return;
    event.preventDefault();
    const next = clamp(gain + direction * step);
    if (next !== gain) onChange(next);
  };

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={-maxGain}
      aria-valuemax={maxGain}
      aria-valuenow={gain}
      aria-valuetext={`${formatGain(gain)} dB`}
      aria-disabled={disabled || undefined}
      onKeyDown={disabled ? undefined : handleKeyDown}
      onKeyUp={disabled ? undefined : onCommit}
      onBlur={disabled ? undefined : onCommit}
      onPointerDown={(event) => {
        if (disabled || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        onDragChange(true);
        updateFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event);
      }}
      onPointerUp={disabled ? undefined : release}
      onPointerCancel={disabled ? undefined : release}
      className={cn(
        "group relative h-full touch-none rounded-lg outline-none focus-visible:bg-current/5",
        disabled ? "cursor-not-allowed" : "cursor-ns-resize",
      )}
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current/10" />
      <motion.span
        className="absolute left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-(--eq-accent) opacity-70"
        initial={false}
        animate={{ top: `${fillTop}%`, height: `${fillHeight}%` }}
        transition={transition}
      />
      <motion.span
        className="absolute left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_color-mix(in_srgb,var(--eq-accent)_25%,transparent),0_0_18px_color-mix(in_srgb,var(--eq-accent)_70%,transparent)] transition-transform group-hover:scale-125 group-focus-visible:scale-125"
        initial={false}
        animate={{ top: `${ratio * 100}%` }}
        transition={transition}
      />
    </div>
  );
}

export interface EqualizerCurveProps {
  /** One entry per band, low to high; the label is shown under its fader. */
  bands: ReadonlyArray<{ label: string }>;
  /** dB per band, the same length as `bands`. */
  gains: readonly number[];
  /** The faders run from −maxGain to +maxGain dB. */
  maxGain: number;
  /** dB a fader snaps to; default 1. */
  step?: number;
  /** A band moved (drag or arrow key). */
  onChange?: (bandIndex: number, gain: number) => void;
  /** A drag ended, or a key or focus left a fader: the moment to persist. */
  onCommit?: () => void;
  disabled?: boolean;
  /** Overrides the theme's --primary as the accent. */
  accentColor?: string;
  /** Accessible name of a band's fader. */
  bandLabel?: (label: string) => string;
  /** Shows each band's gain above its fader. */
  showValues?: boolean;
  /** For the plot area, e.g. its height; default h-48. */
  plotClassName?: string;
  className?: string;
}

/** Faders over a smooth response curve, with the band labels under them. */
export function EqualizerCurve({
  bands,
  gains,
  maxGain,
  step = 1,
  onChange,
  onCommit,
  disabled = false,
  accentColor,
  bandLabel = (label) => `${label} Hz`,
  showValues = false,
  plotClassName,
  className,
}: EqualizerCurveProps) {
  const fillId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const transition = isDragging ? INSTANT : SPRING;
  const columns = { gridTemplateColumns: `repeat(${bands.length}, minmax(0, 1fr))` };
  const shownGains = bands.map((_, index) => gains[index] ?? 0);

  return (
    <div
      data-slot="equalizer-curve"
      className={cn(disabled && "opacity-50", className)}
      style={
        {
          "--eq-accent": accentColor ?? "var(--primary)",
        } as CSSProperties
      }
    >
      {showValues ? (
        <div
          className="mb-2 grid text-center text-[10px] font-semibold tabular-nums"
          style={columns}
        >
          {shownGains.map((gain, index) => (
            <span
              key={bands[index].label}
              className={gain === 0 ? "opacity-50" : "text-(--eq-accent)"}
            >
              {formatGain(gain)}
            </span>
          ))}
        </div>
      ) : null}

      <div className={cn("relative h-48", plotClassName)}>
        <span className="absolute inset-x-0 top-1/2 h-px bg-current/12" />
        <span className="absolute inset-x-0 top-1/4 h-px bg-current/5" />
        <span className="absolute inset-x-0 top-3/4 h-px bg-current/5" />
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${EQ_CURVE_WIDTH} ${EQ_CURVE_HEIGHT}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          <defs>
            <linearGradient
              id={fillId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1="0"
              y2={EQ_CURVE_HEIGHT}
            >
              <stop offset="0%" stopColor="var(--eq-accent)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="var(--eq-accent)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--eq-accent)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <motion.path
            initial={false}
            animate={{ d: buildEqArea(shownGains, maxGain) }}
            transition={transition}
            fill={`url(#${fillId})`}
          />
          <motion.path
            initial={false}
            animate={{ d: buildEqCurve(shownGains, maxGain) }}
            transition={transition}
            fill="none"
            stroke="var(--eq-accent)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            className="drop-shadow-[0_0_10px_color-mix(in_srgb,var(--eq-accent)_80%,transparent)]"
          />
        </svg>
        <div className="absolute inset-0 grid" style={columns}>
          {bands.map((band, index) => (
            <EqualizerFader
              key={band.label}
              label={bandLabel(band.label)}
              gain={shownGains[index]}
              maxGain={maxGain}
              step={step}
              disabled={disabled || !onChange}
              transition={transition}
              onChange={(gain) => onChange?.(index, gain)}
              onDragChange={setIsDragging}
              onCommit={onCommit}
            />
          ))}
        </div>
      </div>

      <div
        className="mt-3 grid text-center font-mono text-[0.62rem] opacity-50 sm:text-[0.68rem]"
        style={columns}
      >
        {bands.map((band) => (
          <span key={band.label}>{band.label}</span>
        ))}
      </div>
    </div>
  );
}
