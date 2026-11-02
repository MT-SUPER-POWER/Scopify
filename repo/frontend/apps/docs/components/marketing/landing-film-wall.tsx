"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import { LANDING_FILM_SCREENSHOTS } from "@/constants/marketing";

const ROW_COUNT = 3;
const FILM_ROWS = Array.from({ length: ROW_COUNT }, (_, row) =>
  LANDING_FILM_SCREENSHOTS.filter((_, index) => index % ROW_COUNT === row),
);

/** 回声：三排真实截图斜铺成一面底片墙，随滚动相向滑动并慢慢放平。 */
export function LandingFilmWall() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isNear = useInView(sectionRef, { once: true, margin: "100% 0px" });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const forward = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const backward = useTransform(scrollYProgress, [0, 1], ["-30%", "0%"]);
  const tilt = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [28, 4]);

  return (
    <section
      ref={sectionRef}
      data-landing-chapter="echo"
      aria-labelledby="landing-film-title"
      className="relative overflow-hidden py-32"
    >
      <LandingReveal className="mx-auto flex max-w-360 flex-col items-center px-5 text-center">
        <h2
          id="landing-film-title"
          className="landing-display text-[clamp(2.2rem,5vw,4.4rem)] leading-[1.1] font-semibold tracking-[-0.04em] text-white"
        >
          没有效果图。
        </h2>
        <p className="mt-4 text-sm text-white/55 sm:text-base">
          这里的 {LANDING_FILM_SCREENSHOTS.length} 张，都截自正在运行的客户端。
        </p>
      </LandingReveal>

      <div className="relative mt-24 mask-[linear-gradient(90deg,transparent,black_14%,black_86%,transparent)] perspective-[1600px]">
        <motion.div
          className="-ml-[14vw] flex origin-center flex-col gap-4"
          style={{ rotateX: tilt, rotateZ: -6 }}
        >
          {FILM_ROWS.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              className="flex w-max gap-4"
              style={{ x: rowIndex % 2 === 0 ? forward : backward }}
            >
              {row.map((screenshot) => (
                <div
                  key={screenshot.alt}
                  className="group relative aspect-16/10 w-[clamp(15rem,27vw,27rem)] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#0b0d14]"
                >
                  {/* 底片墙整体斜着、还在横移，浏览器的懒加载判断不准，会留下一格格空框；
                      离这一章还有一屏时就全部开始加载，加载完之前先垫一层模糊预览。 */}
                  {isNear ? (
                    <Image
                      src={screenshot.src}
                      alt={screenshot.alt}
                      fill
                      loading="eager"
                      placeholder="blur"
                      sizes="(min-width: 1000px) 27vw, 15rem"
                      className={`${screenshot.fit === "contain" ? "object-contain" : "object-cover object-top-left"} transition-transform duration-700 group-hover:scale-105`}
                    />
                  ) : null}
                </div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
