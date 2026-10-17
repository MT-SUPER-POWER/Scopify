"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { FoliaLatentBackground } from "@/components/marketing/folia-latent-background";
import { FoliaVisualizerRenderer } from "@/components/marketing/folia-visualizer-renderer";
import { LandingSectionHeading } from "@/components/marketing/landing-section-heading";
import {
  LANDING_DEFAULT_VISUALIZER,
  LANDING_FEATURES_DOC_URL,
  LANDING_FOLIA_STAGE_SCREENSHOT,
  LANDING_FOLIA_THEME,
  LANDING_VISUALIZER_MODES,
} from "@/constants/marketing";
import { useLandingSonnetTimeline } from "@/hooks/use-landing-sonnet-timeline";

function LiveVisualizerStage({ mode, paused }: { mode: string; paused: boolean }) {
  const timeline = useLandingSonnetTimeline(paused);
  const coverUrl = LANDING_FOLIA_STAGE_SCREENSHOT.src.src;

  return (
    <>
      <FoliaLatentBackground coverUrl={coverUrl} theme={LANDING_FOLIA_THEME} />
      <div className="absolute inset-0 bg-[#020307]/20" />
      {/* 切换模式时重新挂载，避免不同动画之间残留画布状态。 */}
      <FoliaVisualizerRenderer
        key={mode}
        coverUrl={coverUrl}
        lyricsFontScale={0.56}
        mode={mode}
        reducedMotion={paused}
        showText
        timeline={timeline}
      />
    </>
  );
}

export function LandingVisualizers() {
  const stageRef = useRef<HTMLDivElement>(null);
  const isStageNear = useInView(stageRef, { margin: "200px 0px" });
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [selectedMode, setSelectedMode] = useState(LANDING_DEFAULT_VISUALIZER);
  const selectedLabel = LANDING_VISUALIZER_MODES.find((mode) => mode.value === selectedMode)?.label;

  return (
    <section
      aria-labelledby="landing-visualizers-title"
      className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12"
    >
      <div className="border-t border-white/12 pt-12 sm:pt-16">
        <LandingSectionHeading
          id="landing-visualizers-title"
          title={`${LANDING_VISUALIZER_MODES.length} 种歌词动画，总有一种是这首歌的样子`}
          subtitle="每种动画都有自己的排版、节奏与背景。点右边任意一种，舞台会立刻换成它。"
          icon={<Sparkles className="size-4 text-[#1ed760]" strokeWidth={1.8} />}
          meta="点击切换，实时预览"
        />

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:gap-14">
          <figure>
            <div
              ref={stageRef}
              className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#070912] shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
            >
              {isStageNear ? (
                <LiveVisualizerStage mode={selectedMode} paused={prefersReducedMotion} />
              ) : null}
              <span
                aria-live="polite"
                className="absolute top-4 left-4 z-30 inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md"
              >
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#1ed760]/60 motion-reduce:animate-none" />
                  <span className="relative size-2 rounded-full bg-[#1ed760]" />
                </span>
                实时运行 · {selectedLabel}
              </span>
            </div>
            <figcaption className="mt-3 text-xs leading-6 text-white/40">
              这不是录屏：上面是正在这个网页里实时渲染的 Folia，和客户端里用的是同一套代码。
            </figcaption>
          </figure>

          <div>
            <div
              role="group"
              aria-label="选择歌词动画"
              className="grid grid-cols-2 border-t border-white/10"
            >
              {LANDING_VISUALIZER_MODES.map((mode, index) => {
                const isSelected = mode.value === selectedMode;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedMode(mode.value)}
                    className="group flex items-baseline gap-3 border-b border-white/10 py-3 text-left transition-colors odd:pr-4 even:border-l even:pl-4 hover:bg-white/3"
                  >
                    <span className="font-mono text-[0.62rem] tracking-[0.14em] text-white/28 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`landing-display text-lg transition-colors ${
                        isSelected ? "text-[#1ed760]" : "text-white/75 group-hover:text-white"
                      }`}
                    >
                      {mode.label}
                    </span>
                    {isSelected ? (
                      <span className="text-[0.62rem] text-[#1ed760]/80">播放中</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <Link
              href={`${LANDING_FEATURES_DOC_URL}#歌词与-folia`}
              className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              了解 Folia 歌词舞台
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
