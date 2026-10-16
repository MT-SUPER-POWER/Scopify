import Image from "next/image";
import type { CSSProperties } from "react";

import { LANDING_FILM_SCREENSHOTS } from "@/constants/marketing";

const COLUMN_SIZE = 8;
const COLUMN_DURATIONS = ["64s", "72s", "58s", "68s"] as const;

const buildColumn = (offset: number) =>
  Array.from(
    { length: COLUMN_SIZE },
    (_, index) => LANDING_FILM_SCREENSHOTS[(offset + index) % LANDING_FILM_SCREENSHOTS.length]!,
  );

/** 首屏右侧倾斜的界面截图海报墙，奇偶列反向缓慢滚动。 */
export function LandingHeroMural() {
  const columns = COLUMN_DURATIONS.map((duration, index) => ({
    duration,
    screenshots: buildColumn(index * 5),
  }));

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[60%] overflow-hidden select-none sm:block xl:w-[62%]"
    >
      <div className="absolute -inset-y-40 -right-24 w-[124%] origin-top-right rotate-[-4deg] skew-y-[-1.5deg] opacity-80">
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-4">
          {columns.map((column, columnIndex) => (
            <div
              key={column.duration}
              className={`landing-marquee-y flex-col ${
                columnIndex % 2 === 1 ? "landing-marquee-reverse" : ""
              } ${columnIndex === 3 ? "hidden lg:flex" : "flex"}`}
              style={{ "--landing-marquee-duration": column.duration } as CSSProperties}
            >
              {[...column.screenshots, ...column.screenshots].map((screenshot, index) => (
                <div key={`${columnIndex}-${index}`} className="shrink-0 pb-3">
                  <div className="relative aspect-video overflow-hidden rounded-md border border-white/8 bg-white/4">
                    <Image
                      src={screenshot.src}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 18vw, 24vw"
                      className="object-cover brightness-90"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-y-0 left-0 w-40 bg-linear-to-r from-[#070912] via-[#070912]/80 to-transparent lg:w-72" />
      <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#070912] via-[#070912]/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-[#070912] via-[#070912]/70 to-transparent" />
    </div>
  );
}
