"use client";

import type { RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import desktopScreenshot from "@/assets/features/desktopMusic.png";
import scopifyLogo from "@/assets/logo.png";
import { LANDING_GITHUB_URL } from "@/constants/marketing";

interface LandingRevealProps {
  active: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}

export function LandingReveal({ active, sectionRef }: LandingRevealProps) {
  return (
    <section ref={sectionRef} className="relative min-h-svh overflow-hidden px-[6vw]">
      <motion.div
        className="absolute inset-x-[6vw] top-[8svh] h-[50svh] overflow-hidden rounded-[1.25rem] border border-white/12 bg-black/60 shadow-[0_32px_120px_rgba(0,0,0,0.48)] sm:h-[62svh] sm:rounded-[1.75rem]"
        initial={false}
        animate={{
          opacity: active ? 1 : 0,
          scale: active ? 1 : 0.975,
          filter: active ? "blur(0px)" : "blur(14px)",
        }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={desktopScreenshot}
          alt="Scopify 中运行的 Folia 歌词界面"
          fill
          className="object-cover object-[62%_center] sm:object-contain"
          placeholder="blur"
          sizes="88vw"
        />
      </motion.div>

      <motion.div
        className="absolute inset-x-[6vw] bottom-[6svh] flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 24 }}
        transition={{ duration: 0.8, delay: active ? 0.25 : 0, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <div className="mb-4 flex items-center gap-3 text-white/60">
            <Image src={scopifyLogo} alt="" className="size-7 rounded-md" />
            <span className="text-xs font-medium tracking-[0.08em]">Scopify</span>
          </div>
          <h2 className="landing-display max-w-3xl text-[clamp(2.6rem,5.5vw,6.4rem)] leading-[0.94] font-light tracking-[-0.065em] text-balance">
            每一句，都有自己的样子。
          </h2>
        </div>

        <nav aria-label="项目入口" className="flex shrink-0 gap-6 pb-1 text-sm text-white/58">
          <a
            href={LANDING_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-6 transition-colors hover:text-white hover:underline"
          >
            GitHub ↗
          </a>
          <Link
            href="/docs"
            className="underline-offset-6 transition-colors hover:text-white hover:underline"
          >
            Documentation →
          </Link>
        </nav>
      </motion.div>
    </section>
  );
}
