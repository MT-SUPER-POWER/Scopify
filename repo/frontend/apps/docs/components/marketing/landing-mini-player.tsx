"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useState } from "react";

import { LandingAlbumCover } from "@/components/marketing/landing-album-cover";
import { LandingPlayerProgress } from "@/components/marketing/landing-player-progress";
import {
  LANDING_CHAPTERS,
  LANDING_COVER_CROPS,
  LANDING_SONG_DURATION,
} from "@/constants/marketing";
import { useLandingAtmosphere } from "@/hooks/use-landing-atmosphere";
import { useLandingAutoplay } from "@/hooks/use-landing-autoplay";
import { useLandingChapterOffsets } from "@/hooks/use-landing-chapter-offsets";
import { formatSongTime, scrollPageTo } from "@/lib/marketing/landing-time";

const EASE = [0.22, 1, 0.36, 1] as const;
const controlClass =
  "grid size-8 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent";

/** 整页就是一首歌：底部悬浮的播放器显示当前章节，进度即滚动位置，播放键让页面按歌曲时长自己滚。 */
export function LandingMiniPlayer() {
  const { activeChapter } = useLandingAtmosphere();
  const { scrollY, scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const offsets = useLandingChapterOffsets();
  const { isPlaying, toggle } = useLandingAutoplay();
  const [isVisible, setIsVisible] = useState(false);
  const elapsed = useTransform(scrollYProgress, (value) =>
    formatSongTime(value * LANDING_SONG_DURATION),
  );
  useMotionValueEvent(scrollY, "change", (value) =>
    setIsVisible(value > window.innerHeight * 0.45),
  );

  const chapterIndex = Math.max(
    0,
    LANDING_CHAPTERS.findIndex((chapter) => chapter.id === activeChapter),
  );
  const chapter = LANDING_CHAPTERS[chapterIndex]!;
  // 歌放到尾声就退场，把页底完整地让给入口和页脚。
  const shouldShow = isVisible && activeChapter !== "outro";
  const jumpTo = (index: number) => {
    const target = offsets[index];
    if (target) scrollPageTo(target.top, prefersReducedMotion);
  };

  return (
    <AnimatePresence>
      {shouldShow ? (
        <motion.div
          data-landing-player
          role="region"
          aria-label="页面播放器"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed bottom-4 left-1/2 z-50 w-[min(44rem,calc(100vw-1.5rem))] -translate-x-1/2"
        >
          <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c14]/70 py-2 pr-3 pl-2 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:pr-5">
            <span className="relative shrink-0">
              <LandingAlbumCover
                crop={LANDING_COVER_CROPS[0]!}
                className={`size-11 rounded-full ring-1 ring-white/15 ${
                  isPlaying && !prefersReducedMotion ? "animate-[spin_7s_linear_infinite]" : ""
                }`}
              />
              <span className="absolute inset-0 m-auto size-2.5 rounded-full bg-[#0a0c14] ring-1 ring-white/20" />
            </span>

            <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={chapter.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="truncate text-sm font-semibold text-white"
                >
                  {chapter.title}
                </motion.p>
              </AnimatePresence>
              <p className="truncate font-mono text-[0.62rem] tracking-[0.16em] text-white/40 uppercase">
                {String(chapterIndex + 1).padStart(2, "0")} · {chapter.movement} · Scopify
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                aria-label="上一章"
                disabled={chapterIndex === 0}
                onClick={() => jumpTo(chapterIndex - 1)}
                className={`${controlClass} hidden sm:grid`}
              >
                <SkipBack className="size-4" fill="currentColor" />
              </button>
              <button
                type="button"
                aria-label={isPlaying ? "暂停自动播放" : "自动播放整页"}
                aria-pressed={isPlaying}
                onClick={toggle}
                className="grid size-9 place-items-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="size-4" fill="currentColor" />
                ) : (
                  <Play className="size-4 translate-x-px" fill="currentColor" />
                )}
              </button>
              <button
                type="button"
                aria-label="下一章"
                disabled={chapterIndex === LANDING_CHAPTERS.length - 1}
                onClick={() => jumpTo(chapterIndex + 1)}
                className={controlClass}
              >
                <SkipForward className="size-4" fill="currentColor" />
              </button>
            </div>

            <div className="hidden flex-1 items-center gap-3 font-mono text-[0.68rem] text-white/45 tabular-nums sm:flex">
              <motion.span>{elapsed}</motion.span>
              <LandingPlayerProgress
                offsets={offsets}
                progress={scrollYProgress}
                reducedMotion={prefersReducedMotion}
              />
              <span>{formatSongTime(LANDING_SONG_DURATION)}</span>
            </div>

            <motion.span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[#1ed760] sm:hidden"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
