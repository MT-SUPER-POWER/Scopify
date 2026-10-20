"use client";

import { type Transition, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { LandingEqBand } from "@/components/marketing/landing-eq-band";
import {
  LANDING_EQ_BANDS,
  LANDING_EQ_DEFAULT_PRESET,
  LANDING_EQ_MAX_GAIN,
  LANDING_EQ_PRESETS,
} from "@/constants/marketing";
import {
  EQ_CURVE_HEIGHT,
  EQ_CURVE_WIDTH,
  buildEqArea,
  buildEqCurve,
} from "@/lib/marketing/eq-curve";

const FLAT_PRESET = LANDING_EQ_PRESETS[0]!;
const SPRING: Transition = { type: "spring", stiffness: 120, damping: 17, mass: 0.9 };
const INSTANT: Transition = { duration: 0 };

/** 十段均衡器：进入视口后从「水平」推成 V 形；预设可切换，推子可以直接拖。 */
export function LandingEqualizer() {
  const panelRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(panelRef, { once: true, amount: 0.5 });
  const [presetId, setPresetId] = useState(FLAT_PRESET.id);
  const [gains, setGains] = useState<readonly number[]>(FLAT_PRESET.gains);
  const [isDragging, setIsDragging] = useState(false);
  const transition = isDragging ? INSTANT : SPRING;

  const applyPreset = (id: string) => {
    const preset = LANDING_EQ_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setPresetId(preset.id);
    setGains(preset.gains);
  };

  useEffect(() => {
    if (!isInView) return;
    const timer = window.setTimeout(() => {
      const preset = LANDING_EQ_PRESETS.find((item) => item.id === LANDING_EQ_DEFAULT_PRESET)!;
      setPresetId(preset.id);
      setGains(preset.gains);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [isInView]);

  const updateBand = (bandIndex: number, gain: number) => {
    setPresetId("custom");
    setGains((current) => current.map((value, index) => (index === bandIndex ? gain : value)));
  };

  return (
    <div
      ref={panelRef}
      className="rounded-[1.75rem] border border-white/10 bg-[#080b10]/55 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">
          均衡器
          <span className="ml-2 font-mono text-[0.68rem] font-normal tracking-[0.12em] text-white/40">
            ±{LANDING_EQ_MAX_GAIN} dB · 拖动推子试试
          </span>
        </p>
        <div role="radiogroup" aria-label="均衡器预设" className="flex flex-wrap gap-1">
          {LANDING_EQ_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={preset.id === presetId}
              onClick={() => applyPreset(preset.id)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                preset.id === presetId
                  ? "bg-[#1ed760] font-semibold text-black"
                  : "text-white/55 hover:bg-white/8 hover:text-white"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-6 h-56 sm:h-64">
        <span className="absolute inset-x-0 top-1/2 h-px bg-white/12" />
        <span className="absolute inset-x-0 top-1/4 h-px bg-white/5" />
        <span className="absolute inset-x-0 top-3/4 h-px bg-white/5" />
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${EQ_CURVE_WIDTH} ${EQ_CURVE_HEIGHT}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          <defs>
            <linearGradient
              id="landing-eq-fill"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1="0"
              y2={EQ_CURVE_HEIGHT}
            >
              <stop offset="0%" stopColor="#1ed760" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#1ed760" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#1ed760" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <motion.path
            initial={false}
            animate={{ d: buildEqArea(gains, LANDING_EQ_MAX_GAIN) }}
            transition={transition}
            fill="url(#landing-eq-fill)"
          />
          <motion.path
            initial={false}
            animate={{ d: buildEqCurve(gains, LANDING_EQ_MAX_GAIN) }}
            transition={transition}
            fill="none"
            stroke="#1ed760"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            className="drop-shadow-[0_0_10px_rgba(30,215,96,0.8)]"
          />
        </svg>
        <div className="absolute inset-0 grid grid-cols-10">
          {LANDING_EQ_BANDS.map((frequency, index) => (
            <LandingEqBand
              key={frequency}
              frequency={frequency}
              gain={gains[index] ?? 0}
              onChange={(gain) => updateBand(index, gain)}
              onDragChange={setIsDragging}
              transition={transition}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-10 text-center font-mono text-[0.62rem] text-white/40 sm:text-[0.68rem]">
        {LANDING_EQ_BANDS.map((frequency) => (
          <span key={frequency}>{frequency}</span>
        ))}
      </div>
    </div>
  );
}
