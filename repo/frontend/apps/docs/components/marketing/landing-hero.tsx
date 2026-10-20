"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Download, Globe } from "lucide-react";
import { useRef } from "react";

import { LandingAppWindow } from "@/components/marketing/landing-app-window";
import { LandingHeroCovers } from "@/components/marketing/landing-hero-covers";
import {
  LANDING_MAIN_SCREENSHOT,
  LANDING_RELEASES_URL,
  LANDING_WEB_APP_URL,
} from "@/constants/marketing";
import { useScrollTransform } from "@/hooks/use-scroll-transform";
import {
  HERO_PUSH_START_VH,
  HERO_SECTION_VH,
  HERO_STICKY_VH,
  heroAt,
} from "@/lib/marketing/landing-hero-timeline";
import { approachScale } from "@/lib/marketing/landing-stage-camera";

const EASE = [0.22, 1, 0.36, 1] as const;
/** 镜头穿过窗口时窗口最终放大到的倍数。 */
const PUSH_SCALE = 2.8;
const pushProgress = (progress: number) =>
  (progress * HERO_STICKY_VH - HERO_PUSH_START_VH) / (HERO_STICKY_VH - HERO_PUSH_START_VH);

/**
 * 前奏：先只有声场与一句话；往下滚，客户端窗口从画面底部倾斜着升起、放平，
 * 再退半步让出位置给「原样都在」；最后镜头往前推，穿过窗口，远处的歌词舞台随之亮起。
 */
export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const titleOpacity = useScrollTransform(scrollYProgress, [0, heroAt(38)], [1, 0]);
  const titleY = useScrollTransform(scrollYProgress, [0, heroAt(57)], ["0vh", "-10vh"]);
  const titleScale = useScrollTransform(scrollYProgress, [0, heroAt(57)], [1, 0.94]);
  const titleFilter = useScrollTransform(
    scrollYProgress,
    [0, heroAt(42)],
    ["blur(0px)", "blur(12px)"],
  );
  const windowStops = [0, heroAt(85), heroAt(114), heroAt(163)];
  const windowY = useScrollTransform(scrollYProgress, windowStops, ["60vh", "0vh", "0vh", "13vh"]);
  const windowRotate = useScrollTransform(
    scrollYProgress,
    [0, heroAt(85)],
    [prefersReducedMotion ? 0 : 28, 0],
  );
  const windowScale = useScrollTransform(scrollYProgress, windowStops, [0.86, 1, 1, 0.78]);
  const captionStops = [heroAt(118), heroAt(152), heroAt(HERO_PUSH_START_VH)];
  const captionOpacity = useScrollTransform(
    scrollYProgress,
    [...captionStops, heroAt(HERO_PUSH_START_VH + 30)],
    [0, 1, 1, 0],
  );
  const captionY = useScrollTransform(
    scrollYProgress,
    [...captionStops, heroAt(HERO_PUSH_START_VH + 40)],
    [28, 0, 0, prefersReducedMotion ? 0 : -90],
  );
  const captionScale = useScrollTransform(
    scrollYProgress,
    [heroAt(HERO_PUSH_START_VH), heroAt(HERO_PUSH_START_VH + 40)],
    [1, prefersReducedMotion ? 1 : 1.25],
  );
  // 推镜头：窗口越推越大、压暗、失焦，在前奏结束前完全淡出，把画面交给远处的舞台。
  const pushScale = useTransform(scrollYProgress, (value) =>
    prefersReducedMotion ? 1 : approachScale(pushProgress(value), 1, PUSH_SCALE),
  );
  const pushOpacity = useScrollTransform(
    scrollYProgress,
    [heroAt(HERO_PUSH_START_VH + 20), heroAt(HERO_STICKY_VH - 8)],
    [1, 0],
  );
  const pushFilter = useScrollTransform(
    scrollYProgress,
    [heroAt(HERO_PUSH_START_VH), heroAt(HERO_PUSH_START_VH + 45), heroAt(HERO_STICKY_VH - 8)],
    ["blur(0px) brightness(1)", "blur(3px) brightness(0.55)", "blur(14px) brightness(0.3)"],
  );
  const reveal = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28, filter: "blur(10px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 1.1, delay, ease: EASE },
        };

  return (
    <section
      ref={sectionRef}
      data-landing-chapter="intro"
      aria-labelledby="landing-hero-title"
      className="relative"
      style={{ height: `${HERO_SECTION_VH}vh` }}
    >
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-x-0 top-0 flex h-[74svh] flex-col items-center justify-center px-5 pt-10 text-center"
          style={{ opacity: titleOpacity, y: titleY, scale: titleScale, filter: titleFilter }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(46%_42%_at_50%_52%,rgba(5,6,11,0.6),transparent_78%)]"
          />
          <motion.p
            className="mb-7 font-mono text-[0.68rem] tracking-[0.28em] text-white/55 uppercase"
            {...reveal(0.1)}
          >
            网易云音乐 · 开源桌面客户端
          </motion.p>
          <motion.h1
            id="landing-hero-title"
            className="landing-display text-[clamp(2.7rem,7.4vw,6.6rem)] leading-[1.06] font-semibold tracking-[-0.04em] text-balance text-white"
            {...reveal(0.2)}
          >
            把每天听的歌，
            <br />
            <span className="landing-shimmer">听成自己的样子。</span>
          </motion.h1>
          <motion.p
            className="mt-6 max-w-md text-sm leading-7 text-white/55 sm:text-base"
            {...reveal(0.35)}
          >
            登录网易云音乐账号就能用。剩下的，交给 Folia 和你的耳朵。
          </motion.p>
          <motion.div className="mt-9 flex flex-wrap justify-center gap-3" {...reveal(0.5)}>
            <a
              href={LANDING_RELEASES_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1ed760] px-6 text-sm font-bold text-black shadow-[0_12px_48px_rgba(30,215,96,0.32)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <Download className="size-4" strokeWidth={2.4} />
              下载桌面端
            </a>
            <a
              href={LANDING_WEB_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/6 px-6 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/12"
            >
              <Globe className="size-4" />
              在线体验
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-x-0 top-[10svh] z-10 px-5 text-center"
          style={{ opacity: captionOpacity, y: captionY, scale: captionScale }}
        >
          <p className="landing-display text-[clamp(1.6rem,3.4vw,2.9rem)] font-semibold tracking-[-0.03em] text-white">
            你的音乐库，原样都在。
          </p>
          <p className="mt-2 text-sm text-white/50 sm:text-base">
            歌单、红心、每日推荐与播客，登录即见，一首不少。
          </p>
        </motion.div>

        {/* 透视放在推镜头这一层：它的淡出与失焦会压平 3D，透视得留在被压平之前。 */}
        <motion.div
          className="relative perspective-[1800px]"
          style={{ scale: pushScale, opacity: pushOpacity, filter: pushFilter }}
        >
          <motion.div
            className="relative w-[min(88vw,70rem,calc((100svh-9rem)*1.8))] origin-[50%_0%] transform-3d"
            style={{ y: windowY, rotateX: windowRotate, scale: windowScale }}
          >
            <LandingAppWindow
              screenshot={LANDING_MAIN_SCREENSHOT}
              sizes="(min-width: 1280px) 70rem, 88vw"
              priority
            />
            <LandingHeroCovers progress={scrollYProgress} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
