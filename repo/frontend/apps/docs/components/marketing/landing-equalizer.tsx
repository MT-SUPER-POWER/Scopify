"use client";

import { EqualizerCurve } from "@scopify/ui/scopify/components/equalizer-curve";
import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  LANDING_EQ_BANDS,
  LANDING_EQ_DEFAULT_PRESET,
  LANDING_EQ_MAX_GAIN,
  LANDING_EQ_PRESETS,
} from "@/constants/marketing";

const FLAT_PRESET = LANDING_EQ_PRESETS[0]!;
const BANDS = LANDING_EQ_BANDS.map((label) => ({ label }));

/** 十段均衡器：进入视口后从「水平」推成 V 形；预设可切换，推子可以直接拖。 */
export function LandingEqualizer() {
  const panelRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(panelRef, { once: true, amount: 0.5 });
  const [presetId, setPresetId] = useState(FLAT_PRESET.id);
  const [gains, setGains] = useState<readonly number[]>(FLAT_PRESET.gains);

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

      <EqualizerCurve
        bands={BANDS}
        gains={gains}
        maxGain={LANDING_EQ_MAX_GAIN}
        step={0.5}
        onChange={updateBand}
        accentColor="#1ed760"
        bandLabel={(label) => `${label} Hz 增益`}
        className="mt-6 text-white"
        plotClassName="h-56 sm:h-64"
      />
    </div>
  );
}
