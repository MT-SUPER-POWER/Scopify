import { Film } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { LandingSectionHeading } from "@/components/marketing/landing-section-heading";
import { LANDING_FILM_SCREENSHOTS } from "@/constants/marketing";
import type { LandingScreenshot } from "@/types/marketing";

const FILM_ROWS: readonly {
  duration: string;
  reverse: boolean;
  screenshots: LandingScreenshot[];
}[] = [
  {
    duration: "70s",
    reverse: false,
    screenshots: LANDING_FILM_SCREENSHOTS.filter((_, index) => index % 2 === 0),
  },
  {
    duration: "78s",
    reverse: true,
    screenshots: LANDING_FILM_SCREENSHOTS.filter((_, index) => index % 2 === 1),
  },
];

export function LandingFilmWall() {
  return (
    <section aria-labelledby="landing-film-title" className="w-full">
      <div className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-12">
        <div className="border-t border-white/12 pt-12 sm:pt-16">
          <LandingSectionHeading
            id="landing-film-title"
            title={`${LANDING_FILM_SCREENSHOTS.length} 张截图，拼成 Scopify 的底片`}
            subtitle="没有效果图。每一张都来自正在运行的客户端，留下它最直观的颜色与面孔。"
            icon={<Film className="size-4 text-[#1ed760]" strokeWidth={1.8} />}
            meta="悬停可暂停"
          />
        </div>
      </div>

      <div className="relative mt-10 overflow-hidden py-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-[#070912] to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-[#070912] to-transparent sm:w-32" />

        <div className="flex flex-col gap-3 sm:gap-4">
          {FILM_ROWS.map((row) => (
            <div
              key={row.duration}
              className={`landing-marquee-x flex ${row.reverse ? "landing-marquee-reverse" : ""}`}
              style={{ "--landing-marquee-duration": row.duration } as CSSProperties}
            >
              {[...row.screenshots, ...row.screenshots].map((screenshot, index) => (
                <div key={`${row.duration}-${index}`} className="shrink-0 pr-3 sm:pr-4">
                  <div className="group relative aspect-video h-32 overflow-hidden rounded-lg border border-white/10 bg-white/4 sm:h-44 lg:h-52">
                    <Image
                      src={screenshot.src}
                      alt={index < row.screenshots.length ? screenshot.alt : ""}
                      fill
                      sizes="(min-width: 1024px) 370px, (min-width: 640px) 312px, 228px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
