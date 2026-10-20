"use client";

import { motion, useReducedMotion, useScroll } from "framer-motion";
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

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * 前奏：先只有声场与一句话；往下滚，客户端窗口从画面底部倾斜着升起、放平，
 * 再退半步让出位置给「原样都在」。
 */
export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const titleOpacity = useScrollTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const titleY = useScrollTransform(scrollYProgress, [0, 0.3], ["0vh", "-10vh"]);
  const titleScale = useScrollTransform(scrollYProgress, [0, 0.3], [1, 0.94]);
  const titleFilter = useScrollTransform(scrollYProgress, [0, 0.22], ["blur(0px)", "blur(12px)"]);
  const windowY = useScrollTransform(
    scrollYProgress,
    [0, 0.45, 0.6, 0.86],
    ["60vh", "0vh", "0vh", "13vh"],
  );
  const windowRotate = useScrollTransform(
    scrollYProgress,
    [0, 0.45],
    [prefersReducedMotion ? 0 : 28, 0],
  );
  const windowScale = useScrollTransform(scrollYProgress, [0, 0.45, 0.6, 0.86], [0.86, 1, 1, 0.78]);
  const captionOpacity = useScrollTransform(scrollYProgress, [0.62, 0.8], [0, 1]);
  const captionY = useScrollTransform(scrollYProgress, [0.62, 0.8], [28, 0]);
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
      className="relative h-[290vh]"
    >
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden perspective-[1800px]">
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
          style={{ opacity: captionOpacity, y: captionY }}
        >
          <p className="landing-display text-[clamp(1.6rem,3.4vw,2.9rem)] font-semibold tracking-[-0.03em] text-white">
            你的音乐库，原样都在。
          </p>
          <p className="mt-2 text-sm text-white/50 sm:text-base">
            歌单、红心、每日推荐与播客，登录即见，一首不少。
          </p>
        </motion.div>

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
      </div>
    </section>
  );
}
