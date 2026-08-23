"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import scopifyLogo from "@/assets/logo.png";
import { LANDING_GITHUB_URL } from "@/constants/marketing";
import type { LandingEpilogueProps } from "@/types/marketing";

const EPILOGUE_INDEX = [
  {
    number: "01",
    title: "网易云音乐",
    description: "搜索、歌单、收藏与播放队列。",
  },
  {
    number: "02",
    title: "Folia",
    description: "流体背景、逐字歌词与多种动态排版。",
  },
  {
    number: "03",
    title: "桌面端",
    description: "为完整播放器体验设计的独立窗口。",
  },
] as const;

export function LandingEpilogue({ active, sectionRef }: LandingEpilogueProps) {
  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-svh flex-col overflow-hidden px-6 py-6 sm:px-[6vw] sm:py-[7svh]"
    >
      <motion.div
        className="flex items-center justify-between gap-6 text-white/60"
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center gap-3 max-sm:pl-10">
          <Image src={scopifyLogo} alt="" className="hidden size-8 rounded-lg sm:block" />
          <span className="text-sm font-medium tracking-[0.05em]">Scopify</span>
        </div>
        <span className="text-[0.65rem] tracking-[0.18em] uppercase sm:text-xs">
          Open source · Desktop
        </span>
      </motion.div>

      <div className="grid flex-1 items-end gap-12 py-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(24rem,0.82fr)] lg:items-center lg:gap-[7vw] lg:py-[8svh]">
        <motion.div
          initial={false}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 44 }}
          transition={{ duration: 1, delay: active ? 0.12 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-5 text-[0.65rem] tracking-[0.2em] text-white/42 uppercase sm:text-xs">
            05 / Closing track
          </p>
          <h2 className="landing-display max-w-4xl text-[clamp(3.25rem,7vw,8.25rem)] leading-[0.88] font-light tracking-[-0.07em] text-balance">
            每一句，
            <br />
            都有自己的样子。
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/52 sm:mt-7 sm:text-base">
            网易云音乐 × Folia 的开源桌面播放器。
          </p>
        </motion.div>

        <motion.ol
          aria-label="Scopify 产品能力"
          className="border-b border-white/14"
          initial={false}
          animate={{ opacity: active ? 1 : 0, x: active ? 0 : 36 }}
          transition={{ duration: 0.9, delay: active ? 0.24 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          {EPILOGUE_INDEX.map((item) => (
            <li
              key={item.number}
              className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-white/14 py-4 sm:grid-cols-[3rem_8rem_1fr] sm:items-baseline sm:gap-4 sm:py-6"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.16em] text-white/30">
                {item.number}
              </span>
              <h3 className="text-base font-medium tracking-[-0.02em] text-white/88">
                {item.title}
              </h3>
              <p className="col-start-2 text-sm leading-6 text-white/45 sm:col-start-3">
                {item.description}
              </p>
            </li>
          ))}
        </motion.ol>
      </div>

      <motion.nav
        aria-label="项目入口"
        className="grid border-t border-white/14 text-white/72 sm:grid-cols-2"
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.8, delay: active ? 0.36 : 0 }}
      >
        <Link
          href="/docs"
          className="group flex items-end justify-between border-b border-white/14 py-4 sm:border-r sm:border-b-0 sm:py-5 sm:pr-8"
        >
          <span>
            <span className="block text-[0.65rem] tracking-[0.16em] text-white/35 uppercase">
              Documentation
            </span>
            <span className="mt-1 block text-xl tracking-[-0.03em] transition-colors group-hover:text-white">
              阅读文档
            </span>
          </span>
          <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>
        <a
          href={LANDING_GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="group flex items-end justify-between py-4 sm:py-5 sm:pl-8"
        >
          <span>
            <span className="block text-[0.65rem] tracking-[0.16em] text-white/35 uppercase">
              Source code
            </span>
            <span className="mt-1 block text-xl tracking-[-0.03em] transition-colors group-hover:text-white">
              查看源码
            </span>
          </span>
          <span className="text-xl transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
            ↗
          </span>
        </a>
      </motion.nav>
    </section>
  );
}
