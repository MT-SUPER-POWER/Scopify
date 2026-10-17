"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BookOpen, Download, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import scopifyLogo from "@/assets/logo.png";
import { FoliaLatentBackground } from "@/components/marketing/folia-latent-background";
import { LandingHeroMural } from "@/components/marketing/landing-hero-mural";
import {
  LANDING_AUDIO_QUALITY_COUNT,
  LANDING_FOLIA_STAGE_SCREENSHOT,
  LANDING_FOLIA_THEME,
  LANDING_GITHUB_URL,
  LANDING_RELEASES_URL,
  LANDING_VISUALIZER_MODES,
  LANDING_WEB_APP_URL,
} from "@/constants/marketing";

const EASE = [0.22, 1, 0.36, 1] as const;

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null);
  // 首屏离开视口后卸载 WebGL 背景，避免与下方的实时 Folia 舞台争抢 GPU。
  const isHeroVisible = useInView(sectionRef);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const reveal = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="landing-hero-title"
      className="relative isolate flex min-h-svh flex-col overflow-hidden"
    >
      <div className="absolute inset-0 -z-10">
        {isHeroVisible ? (
          <FoliaLatentBackground
            coverUrl={LANDING_FOLIA_STAGE_SCREENSHOT.src.src}
            theme={LANDING_FOLIA_THEME}
          />
        ) : null}
        <div className="absolute inset-0 bg-[#020307]/55" />
      </div>

      <LandingHeroMural />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-linear-to-r from-[#070912] via-[#070912]/88 to-transparent sm:w-[64%] lg:w-[54%]" />
      <div className="landing-grain pointer-events-none absolute inset-0" />

      <header className="relative z-10 mx-auto flex w-full max-w-360 items-center justify-between px-5 pt-6 sm:px-8 sm:pt-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <Image src={scopifyLogo} alt="" className="size-8 rounded-lg" priority />
          <span className="text-sm font-medium tracking-[0.04em] text-white/80">Scopify</span>
        </Link>
        <nav aria-label="站点导航" className="flex items-center gap-5 text-sm text-white/60">
          <a
            href={LANDING_WEB_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            在线体验
          </a>
          <Link href="/docs" className="transition-colors hover:text-white">
            文档
          </Link>
          <a
            href={LANDING_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white"
          >
            GitHub
          </a>
        </nav>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-360 flex-1 flex-col justify-center px-5 py-16 sm:px-8 lg:px-12">
        <div className="max-w-xl lg:max-w-2xl">
          <motion.div
            className="mb-8 inline-flex flex-col items-start gap-1 text-[#d6b36a]"
            {...reveal(0)}
          >
            <span className="flex items-center gap-2">
              <span className="h-px w-6 bg-linear-to-r from-transparent to-[#d6b36a]/80" />
              <span className="landing-display text-sm font-semibold tracking-[0.2em]">
                开源桌面播放器
              </span>
              <span className="h-px w-6 bg-linear-to-l from-transparent to-[#d6b36a]/80" />
            </span>
            <span className="pl-8 text-[0.68rem] tracking-[0.12em] text-white/55">
              网易云音乐 × Folia · AGPL-3.0
            </span>
          </motion.div>

          <motion.h1
            id="landing-hero-title"
            className="landing-display text-[clamp(2.6rem,6vw,5.4rem)] leading-[1.08] font-semibold tracking-[-0.045em] text-white"
            {...reveal(0.08)}
          >
            <span className="block">把每天听的歌，</span>
            <span className="block">听成自己的样子。</span>
          </motion.h1>

          <motion.p
            className="mt-5 max-w-lg text-sm leading-7 text-white/60 sm:text-base sm:leading-8"
            {...reveal(0.16)}
          >
            {
              "登录网易云音乐账号，歌单、收藏和每日推荐原样都在；再交给 Folia，让每一句歌词都换一种方式出场。"
            }
          </motion.p>

          <motion.dl
            className="mt-8 flex flex-wrap items-baseline gap-x-8 gap-y-3"
            {...reveal(0.24)}
          >
            <div className="flex items-baseline gap-2">
              <dt className="sr-only">歌词动画</dt>
              <dd className="text-5xl font-black tracking-tight text-[#1ed760] tabular-nums lg:text-6xl">
                {LANDING_VISUALIZER_MODES.length}
              </dd>
              <dd className="text-sm font-bold text-white/85 lg:text-lg">种歌词动画</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="sr-only">音质</dt>
              <dd className="text-5xl font-black tracking-tight text-white tabular-nums lg:text-6xl">
                {LANDING_AUDIO_QUALITY_COUNT}
              </dd>
              <dd className="text-sm font-bold text-white/85 lg:text-lg">档音质</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="sr-only">均衡器</dt>
              <dd className="text-5xl font-black tracking-tight text-white tabular-nums lg:text-6xl">
                10
              </dd>
              <dd className="text-sm font-bold text-white/85 lg:text-lg">段均衡器</dd>
            </div>
          </motion.dl>

          <motion.div className="mt-9 flex flex-wrap items-center gap-3" {...reveal(0.32)}>
            <a
              href={LANDING_RELEASES_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1ed760] px-6 text-sm font-bold text-black shadow-[0_10px_40px_rgba(30,215,96,0.28)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="size-4" strokeWidth={2.4} />
              下载桌面端
            </a>
            <a
              href={LANDING_WEB_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/16 bg-white/6 px-6 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/10"
            >
              <Globe className="size-4" />
              在线体验
            </a>
            <Link
              href="/docs"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/16 bg-white/6 px-6 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/10"
            >
              <BookOpen className="size-4" />
              阅读文档
            </Link>
            <a
              href={LANDING_GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex h-11 items-center gap-1 px-2 text-sm text-white/60 transition-colors hover:text-white"
            >
              查看源码
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
