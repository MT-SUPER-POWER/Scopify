"use client";

import type { RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import scopifyLogo from "@/assets/logo.png";
import { LANDING_GITHUB_URL } from "@/constants/marketing";

interface LandingEpilogueProps {
  active: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}

export function LandingEpilogue({ active, sectionRef }: LandingEpilogueProps) {
  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-svh flex-col justify-between overflow-hidden px-[6vw] py-[7svh]"
    >
      <motion.div
        className="flex items-center gap-3 text-white/60"
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        <Image src={scopifyLogo} alt="" className="size-8 rounded-lg" />
        <span className="text-sm font-medium tracking-[0.05em]">Scopify</span>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 44 }}
        transition={{ duration: 1, delay: active ? 0.12 : 0, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="landing-display max-w-5xl text-[clamp(3.3rem,9vw,10rem)] leading-[0.88] font-light tracking-[-0.075em] text-balance">
          每一句，
          <br />
          都有自己的样子。
        </h2>
      </motion.div>

      <motion.nav
        aria-label="项目入口"
        className="flex items-center justify-between border-t border-white/14 pt-5 text-sm text-white/58"
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.8, delay: active ? 0.36 : 0 }}
      >
        <Link
          href="/docs"
          className="underline-offset-6 transition-colors hover:text-white hover:underline"
        >
          Documentation →
        </Link>
        <a
          href={LANDING_GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-6 transition-colors hover:text-white hover:underline"
        >
          GitHub ↗
        </a>
      </motion.nav>
    </section>
  );
}
