"use client";

import type { RefObject } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import desktopScreenshot from "@/assets/features/desktopMusic.png";
import foliaScreenshot from "@/assets/features/lyricDynamic.png";
import mainScreenshot from "@/assets/features/main.png";

interface LandingInterfaceProps {
  sectionRef: RefObject<HTMLElement | null>;
}

const frameClass =
  "relative aspect-[4/5] overflow-hidden rounded-[1.1rem] border border-white/12 bg-black/55 shadow-[0_30px_110px_rgba(0,0,0,0.42)] sm:aspect-video sm:rounded-[1.45rem]";

const interfaceFrames = [
  {
    alt: "Scopify 主界面",
    index: "01",
    label: "主界面",
    objectPosition: "34% center",
    src: mainScreenshot,
  },
  {
    alt: "Scopify 桌面 Folia 界面",
    index: "02",
    label: "桌面 Folia",
    objectPosition: "center",
    src: desktopScreenshot,
  },
  {
    alt: "Scopify 动态歌词界面",
    index: "03",
    label: "动态歌词",
    objectPosition: "center",
    src: foliaScreenshot,
  },
] as const;

export function LandingInterface({ sectionRef }: LandingInterfaceProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <section
      ref={sectionRef}
      aria-label="Scopify 真实界面"
      className="relative overflow-hidden bg-[#070912]/82"
    >
      {interfaceFrames.map((frame) => (
        <article
          key={frame.index}
          className="relative flex min-h-svh items-center px-[5vw] py-[7svh]"
        >
          <motion.div
            className="mx-auto w-full max-w-[78rem]"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.35 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="mb-5 flex items-end justify-between border-b border-white/12 pb-4">
              <h2 className="landing-display text-[clamp(1.9rem,3.2vw,3.8rem)] leading-none font-light tracking-[-0.055em]">
                {frame.label}
              </h2>
              <span className="pb-1 text-[0.62rem] font-medium tracking-[0.24em] text-white/38">
                {frame.index} / 03
              </span>
            </header>
            <div className={frameClass}>
              <Image
                src={frame.src}
                alt={frame.alt}
                fill
                className="object-cover sm:object-contain"
                style={{ objectPosition: frame.objectPosition }}
                placeholder="blur"
                sizes="(min-width: 640px) 88vw, 90vw"
              />
            </div>
          </motion.div>
        </article>
      ))}
    </section>
  );
}
