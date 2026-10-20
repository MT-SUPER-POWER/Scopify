"use client";

import { useState } from "react";

import { LandingChapterLabel } from "@/components/marketing/landing-chapter-label";
import { LandingReveal } from "@/components/marketing/landing-reveal";
import { LandingThemePreview } from "@/components/marketing/landing-theme-preview";
import { LANDING_THEME_DEFAULT_INTENSITY, LANDING_THEME_PRESETS } from "@/constants/marketing";
import { useLandingAtmosphere } from "@/hooks/use-landing-atmosphere";
import { paletteFromTheme, themeGradient } from "@/lib/marketing/landing-palette";

const CUSTOM_THEME_ID = "custom";

/** 变奏：挑一个主题，整页声场跟着换色，并一直带到页面结尾。 */
export function LandingThemes() {
  const { setThemePalette } = useLandingAtmosphere();
  const [selectedId, setSelectedId] = useState<string>(LANDING_THEME_PRESETS[4]!.id);
  const [customTop, setCustomTop] = useState("#1ED760");
  const [customBottom, setCustomBottom] = useState("#1B3A2A");
  const [intensity, setIntensity] = useState(LANDING_THEME_DEFAULT_INTENSITY);
  const preset = LANDING_THEME_PRESETS.find((item) => item.id === selectedId);
  const top = preset?.top ?? customTop;
  const bottom = preset?.bottom ?? customBottom;
  const themeName = preset?.name ?? "我的主题";

  const pickTheme = (id: string, nextTop: string, nextBottom: string) => {
    setSelectedId(id);
    setThemePalette(paletteFromTheme(nextTop, nextBottom));
  };

  return (
    <section
      data-landing-chapter="variation"
      aria-labelledby="landing-themes-title"
      className="relative mx-auto flex min-h-svh w-full max-w-360 flex-col justify-center px-5 py-32 sm:px-8 lg:px-12"
    >
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-20">
        <LandingReveal>
          <LandingChapterLabel chapter="variation" />
          <h2
            id="landing-themes-title"
            className="landing-display mt-6 text-[clamp(2.2rem,4.8vw,4.2rem)] leading-[1.1] font-semibold tracking-[-0.04em] text-white"
          >
            颜色，
            <br />
            由你来定。
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/55 sm:text-base">
            挑一个主题试试 —— 这一页剩下的部分，也会换成你选的颜色。
          </p>

          <div role="radiogroup" aria-label="精选主题" className="mt-10 flex flex-wrap gap-3">
            {[
              ...LANDING_THEME_PRESETS,
              { id: CUSTOM_THEME_ID, name: "自定义", top: customTop, bottom: customBottom },
            ].map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => pickTheme(item.id, item.top, item.bottom)}
                  className="group flex flex-col items-center gap-2"
                >
                  <span
                    aria-hidden="true"
                    className={`block size-12 rounded-full bg-[#121212] transition-all duration-300 ${
                      isSelected
                        ? "scale-110 ring-2 ring-white ring-offset-4 ring-offset-[#05060b]"
                        : "ring-1 ring-white/15 group-hover:scale-105"
                    }`}
                    style={{ backgroundImage: themeGradient(item.top, item.bottom) }}
                  />
                  <span className={`text-xs ${isSelected ? "text-white" : "text-white/45"}`}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className={`mt-8 grid grid-cols-2 gap-3 transition-opacity ${selectedId === CUSTOM_THEME_ID ? "" : "opacity-45"}`}
          >
            {(
              [
                [
                  "上方颜色",
                  customTop,
                  setCustomTop,
                  (value: string) => pickTheme(CUSTOM_THEME_ID, value, customBottom),
                ],
                [
                  "下方颜色",
                  customBottom,
                  setCustomBottom,
                  (value: string) => pickTheme(CUSTOM_THEME_ID, customTop, value),
                ],
              ] as const
            ).map(([label, value, setValue, apply]) => (
              <label
                key={label}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-3 py-2"
              >
                <input
                  type="color"
                  value={value}
                  onChange={(event) => {
                    const next = event.target.value.toUpperCase();
                    setValue(next);
                    apply(next);
                  }}
                  className="size-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="min-w-0">
                  <span className="block text-xs text-white/60">{label}</span>
                  <span className="block font-mono text-[0.68rem] text-white/40">{value}</span>
                </span>
              </label>
            ))}
          </div>

          <label className="mt-6 block">
            <span className="mb-2 flex items-baseline justify-between text-xs text-white/45">
              <span>渐变强度</span>
              <span className="font-mono text-white/60 tabular-nums">{intensity}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
              className="w-full accent-white"
            />
          </label>
        </LandingReveal>

        <LandingReveal delay={0.1}>
          <LandingThemePreview
            bottom={bottom}
            intensity={intensity}
            themeName={themeName}
            top={top}
          />
        </LandingReveal>
      </div>
    </section>
  );
}
