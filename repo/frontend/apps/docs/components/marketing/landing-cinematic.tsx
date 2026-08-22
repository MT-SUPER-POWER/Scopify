"use client";

import Image from "next/image";

import desktopScreenshot from "@/assets/features/desktopMusic.png";
import foliaStageScreenshot from "@/assets/features/lyrics-folia-stage.png";
import { FoliaCinematicRenderer } from "@/components/marketing/folia-cinematic-renderer";
import { LANDING_CINEMATIC_CHAPTERS } from "@/constants/marketing";
import { useLandingCinematicTimeline } from "@/hooks/use-landing-cinematic-timeline";
import {
  resolveChapterTitleOpacity,
  resolveHoldOpacity,
  resolveSceneProgress,
} from "@/lib/marketing/folia-cinematic-timeline";

export function LandingCinematic() {
  const { containerRef, timeline } = useLandingCinematicTimeline();
  const activeIndex = LANDING_CINEMATIC_CHAPTERS.findIndex(
    (chapter) => chapter.mode === timeline.mode,
  );
  const activeChapter = LANDING_CINEMATIC_CHAPTERS[activeIndex];
  const sceneProgress = resolveSceneProgress(
    timeline.progress,
    activeChapter.start,
    activeChapter.end,
  );
  const chapterTitleOpacity = resolveChapterTitleOpacity(sceneProgress, activeIndex === 0);
  const desktopOpacity = resolveHoldOpacity(timeline.progress, 0.74, 0.97);

  return (
    <section
      ref={containerRef}
      className="relative h-[620svh]"
      data-landing-cinematic="film-frames"
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-black">
        <div className="absolute inset-x-0 top-[10svh] bottom-[10svh] overflow-hidden border-y border-white/12">
          <FoliaCinematicRenderer
            timeline={timeline}
            coverUrl={foliaStageScreenshot.src}
            showText={chapterTitleOpacity < 0.08}
            className="absolute inset-0"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72),transparent_28%,transparent_72%,rgba(0,0,0,0.72))]" />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgba(0,0,0,0.28)_66%,rgba(0,0,0,0.92)_100%)] transition-opacity duration-300"
            style={{ opacity: chapterTitleOpacity }}
          />
          <div
            className="pointer-events-none absolute inset-[8%] overflow-hidden border border-white/20 shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
            style={{
              opacity: desktopOpacity * 0.86,
              clipPath: `inset(${(1 - desktopOpacity) * 48}% 0 ${(1 - desktopOpacity) * 48}% 0)`,
            }}
          >
            <Image
              src={desktopScreenshot}
              alt="Scopify 桌面音乐壁纸"
              fill
              className="object-cover"
              placeholder="blur"
              sizes="92vw"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-6 top-5 z-20 flex h-[5svh] items-center justify-end sm:inset-x-10 lg:inset-x-16">
          <p className="absolute left-1/2 hidden -translate-x-1/2 text-[10px] tracking-[0.28em] text-white/42 uppercase sm:block">
            Scopify motion picture · Folia
          </p>
          <p className="font-mono text-[10px] text-white/42">
            TC 00:00:
            {Math.floor(timeline.progress * 30)
              .toString()
              .padStart(2, "0")}
          </p>
        </div>

        <div className="pointer-events-none absolute top-[15svh] bottom-[15svh] left-5 z-20 flex w-8 flex-col justify-between sm:left-8">
          {LANDING_CINEMATIC_CHAPTERS.map((chapter, index) => (
            <div
              key={chapter.mode}
              className="flex flex-1 items-center border-l transition-colors duration-300"
              style={{
                borderColor:
                  index === activeIndex ? "rgba(255,255,255,.8)" : "rgba(255,255,255,.12)",
              }}
            >
              <span
                className="-ml-px h-px bg-white transition-all duration-300"
                style={{ width: index === activeIndex ? 26 : 10 }}
              />
            </div>
          ))}
        </div>

        <div
          key={activeChapter.mode}
          className="pointer-events-none absolute inset-x-10 bottom-[15svh] z-30 sm:inset-x-16 lg:inset-x-24"
          style={{
            opacity: chapterTitleOpacity,
            transform: `translate3d(0, ${(1 - chapterTitleOpacity) * 34}px, 0)`,
          }}
        >
          <p className="mb-3 text-[10px] tracking-[0.28em] text-white/48 uppercase">
            Shot 0{activeIndex + 1} · {activeChapter.mode}
          </p>
          <div className="flex items-end justify-between gap-8">
            <h1 className="landing-display max-w-5xl text-[clamp(3rem,8vw,8.5rem)] leading-[0.87] font-light tracking-[-0.065em]">
              {activeChapter.title}
            </h1>
            <span className="hidden font-mono text-[clamp(4rem,10vw,11rem)] leading-none font-extralight text-white/10 lg:block">
              0{activeIndex + 1}
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-6 bottom-4 z-20 flex h-[4svh] items-center justify-between text-[9px] tracking-[0.22em] text-white/36 uppercase sm:inset-x-10 lg:inset-x-16">
          <span>Scroll / scenes</span>
          <span>{activeChapter.description}</span>
        </div>
      </div>
    </section>
  );
}
