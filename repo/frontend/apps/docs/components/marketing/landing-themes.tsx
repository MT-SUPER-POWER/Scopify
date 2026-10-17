"use client";

import { Palette } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { LandingSectionHeading } from "@/components/marketing/landing-section-heading";
import {
  LANDING_FILM_SCREENSHOTS,
  LANDING_THEME_DEFAULT_INTENSITY,
  LANDING_THEME_PRESETS,
} from "@/constants/marketing";

const CUSTOM_THEME_ID = "custom";
const PREVIEW_COVERS = LANDING_FILM_SCREENSHOTS.slice(0, 5);

/** 与客户端 `backgroundGradient()` 相同的首页顶部渐变。 */
const backgroundGradient = (top: string, bottom: string) =>
  `linear-gradient(180deg, ${top} 0%, ${bottom} 38%, transparent 100%)`;

export function LandingThemes() {
  const [selectedId, setSelectedId] = useState<string>(LANDING_THEME_PRESETS[1]!.id);
  const [customTop, setCustomTop] = useState("#1ED760");
  const [customBottom, setCustomBottom] = useState("#1B3A2A");
  const [intensity, setIntensity] = useState(LANDING_THEME_DEFAULT_INTENSITY);
  const preset = LANDING_THEME_PRESETS.find((item) => item.id === selectedId);
  const top = preset?.top ?? customTop;
  const bottom = preset?.bottom ?? customBottom;
  const themeName = preset?.name ?? "我的主题";

  return (
    <section
      aria-labelledby="landing-themes-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="border-t border-white/12 pt-12 sm:pt-16">
        <LandingSectionHeading
          id="landing-themes-title"
          title="主题的颜色，由你来定"
          subtitle="从精选主题里挑一个，或者自己调出上下两种颜色和强度。在客户端里，调好的配色可以存成「我的主题」，随时换回来。"
          icon={<Palette className="size-4 text-[#1ed760]" strokeWidth={1.8} />}
          meta="在下面试试"
        />

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:gap-14">
          <div
            aria-label={`主题预览：${themeName}`}
            className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#121212] shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[78%] transition-[background-image,opacity] duration-500"
              style={{ backgroundImage: backgroundGradient(top, bottom), opacity: intensity / 100 }}
            />
            <div className="relative flex h-full flex-col p-5 sm:p-8">
              <p className="text-[0.65rem] font-medium tracking-[0.18em] text-white/55 uppercase">
                Scopify · {themeName}
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
                晚上好
              </p>
              <p className="mt-auto mb-3 text-sm font-bold text-white/85">为你推荐</p>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {PREVIEW_COVERS.map((cover) => (
                  <div
                    key={cover.alt}
                    className="relative aspect-square overflow-hidden rounded-md bg-white/6"
                  >
                    <Image src={cover.src} alt="" fill sizes="12vw" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-7">
            <fieldset>
              <legend className="mb-3 text-xs font-medium tracking-[0.14em] text-white/45">
                精选主题
              </legend>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3">
                {[...LANDING_THEME_PRESETS, { id: CUSTOM_THEME_ID, name: "自定义" }].map((item) => {
                  const isSelected = item.id === selectedId;
                  const swatch =
                    "top" in item
                      ? backgroundGradient(item.top, item.bottom)
                      : backgroundGradient(customTop, customBottom);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedId(item.id)}
                      className={`flex flex-col items-start gap-2 rounded-lg border p-2 text-left transition-colors ${
                        isSelected
                          ? "border-[#1ed760]/70 bg-white/6"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="block h-10 w-full rounded-md bg-[#121212]"
                        style={{ backgroundImage: swatch }}
                      />
                      <span
                        className={`text-xs font-medium ${isSelected ? "text-white" : "text-white/60"}`}
                      >
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className={selectedId === CUSTOM_THEME_ID ? "" : "opacity-50"}>
              <p className="mb-3 text-xs font-medium tracking-[0.14em] text-white/45">自定义配色</p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["上方颜色", customTop, setCustomTop],
                    ["下方颜色", customBottom, setCustomBottom],
                  ] as const
                ).map(([label, value, setValue]) => (
                  <label
                    key={label}
                    className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2"
                  >
                    <input
                      type="color"
                      value={value}
                      onChange={(event) => {
                        setValue(event.target.value.toUpperCase());
                        setSelectedId(CUSTOM_THEME_ID);
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
            </div>

            <label className="block">
              <span className="mb-3 flex items-baseline justify-between text-xs font-medium tracking-[0.14em] text-white/45">
                <span>强度</span>
                <span className="font-mono tracking-normal text-white/60 tabular-nums">
                  {intensity}%
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={intensity}
                onChange={(event) => setIntensity(Number(event.target.value))}
                className="w-full accent-[#1ed760]"
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
