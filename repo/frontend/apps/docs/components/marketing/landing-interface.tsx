"use client";

import type { RefObject } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import desktopScreenshot from "@/assets/features/desktopMusic.png";
import foliaScreenshot from "@/assets/features/lyricDynamic.png";
import mainScreenshot from "@/assets/features/main.png";

interface LandingInterfaceProps {
  active: boolean;
  sectionRef: RefObject<HTMLElement | null>;
}

const frameClass =
  "relative overflow-hidden rounded-[1.1rem] border border-white/12 bg-black/55 shadow-[0_30px_110px_rgba(0,0,0,0.42)] sm:rounded-[1.45rem]";

export function LandingInterface({ active, sectionRef }: LandingInterfaceProps) {
  return (
    <section
      ref={sectionRef}
      aria-label="Scopify 真实界面"
      className="relative min-h-[154svh] overflow-hidden bg-[#070912]/78 px-[5vw] py-[9svh] sm:min-h-[118svh]"
    >
      <motion.h2
        className="landing-display mb-[7svh] max-w-5xl text-[clamp(2.9rem,7vw,7.8rem)] leading-[0.92] font-light tracking-[-0.065em] text-balance"
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 38 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        不是概念图。
        <br />
        它已经在 Scopify 里。
      </motion.h2>

      <motion.div
        className="grid h-[104svh] grid-cols-1 grid-rows-[1.25fr_1fr_1fr] gap-3 sm:h-[72svh] sm:grid-cols-12 sm:grid-rows-2 sm:gap-4"
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 60 }}
        transition={{ duration: 1.15, delay: active ? 0.16 : 0, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`${frameClass} sm:col-span-8 sm:row-span-2`}>
          <Image
            src={mainScreenshot}
            alt="Scopify 主界面"
            fill
            className="object-cover object-center"
            placeholder="blur"
            sizes="(min-width: 640px) 60vw, 90vw"
          />
        </div>
        <div className={`${frameClass} sm:col-span-4`}>
          <Image
            src={desktopScreenshot}
            alt="Scopify 桌面 Folia 界面"
            fill
            className="object-cover object-center"
            placeholder="blur"
            sizes="(min-width: 640px) 30vw, 90vw"
          />
        </div>
        <div className={`${frameClass} sm:col-span-4`}>
          <Image
            src={foliaScreenshot}
            alt="Scopify 动态歌词界面"
            fill
            className="object-cover object-center"
            placeholder="blur"
            sizes="(min-width: 640px) 30vw, 90vw"
          />
        </div>
      </motion.div>
    </section>
  );
}
