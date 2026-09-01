"use client";

import { useMemo } from "react";

export interface ListeningReportHeroPosterMuralProps {
  covers: string[];
}

export function ListeningReportHeroPosterMural({ covers }: ListeningReportHeroPosterMuralProps) {
  // 分布成 3 ~ 4 列海报柱，并双倍复制构建无缝垂直跑马灯列阵
  const columns = useMemo(() => {
    const col0: string[] = [];
    const col1: string[] = [];
    const col2: string[] = [];
    const col3: string[] = [];

    covers.forEach((url, i) => {
      const targetCol = i % 4;
      if (targetCol === 0) col0.push(url);
      else if (targetCol === 1) col1.push(url);
      else if (targetCol === 2) col2.push(url);
      else col3.push(url);
    });

    const ensureLoop = (arr: string[]) => {
      if (arr.length === 0) return [];
      let res = [...arr];
      while (res.length < 6) {
        res = [...res, ...arr];
      }
      return [...res, ...res];
    };

    return [ensureLoop(col0), ensureLoop(col1), ensureLoop(col2), ensureLoop(col3)];
  }, [covers]);

  if (covers.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden h-full w-[62%] overflow-hidden select-none sm:block lg:w-[60%] xl:w-[64%]"
    >
      {/* 3D 倾斜海报列阵 */}
      <div className="absolute -inset-y-32 -right-16 w-[120%] origin-top-right rotate-[-2.5deg] skew-y-[-1.5deg] opacity-90">
        <div className="grid grid-cols-3 gap-0 lg:grid-cols-4">
          {/* 第 1 列：从上往下缓慢滚动 */}
          <div
            className="animate-marquee-down flex flex-col gap-0"
            style={{ animationDuration: "50s" }}
          >
            {columns[0]?.map((url, i) => (
              <div
                key={`col0-${i}`}
                className={`relative shrink-0 overflow-hidden bg-surface-raised ${
                  i % 2 === 0 ? "aspect-3/4" : "aspect-square"
                }`}
              >
                <img
                  alt=""
                  className="size-full object-cover brightness-95 contrast-105"
                  decoding="async"
                  loading="eager"
                  src={url}
                />
              </div>
            ))}
          </div>

          {/* 第 2 列：从下往上缓慢滚动 */}
          <div
            className="animate-marquee-up flex flex-col gap-0"
            style={{ animationDuration: "58s" }}
          >
            {columns[1]?.map((url, i) => (
              <div
                key={`col1-${i}`}
                className={`relative shrink-0 overflow-hidden bg-surface-raised ${
                  i % 2 === 1 ? "aspect-4/5" : "aspect-square"
                }`}
              >
                <img
                  alt=""
                  className="size-full object-cover brightness-95 contrast-105"
                  decoding="async"
                  loading="eager"
                  src={url}
                />
              </div>
            ))}
          </div>

          {/* 第 3 列：从上往下缓慢滚动 */}
          <div
            className="animate-marquee-down flex flex-col gap-0"
            style={{ animationDuration: "44s" }}
          >
            {columns[2]?.map((url, i) => (
              <div
                key={`col2-${i}`}
                className={`relative shrink-0 overflow-hidden bg-surface-raised ${
                  i % 2 === 0 ? "aspect-square" : "aspect-3/4"
                }`}
              >
                <img
                  alt=""
                  className="size-full object-cover brightness-95 contrast-105"
                  decoding="async"
                  loading="eager"
                  src={url}
                />
              </div>
            ))}
          </div>

          {/* 第 4 列：从下往上缓慢滚动 */}
          <div
            className="animate-marquee-up hidden flex-col gap-0 lg:flex"
            style={{ animationDuration: "52s" }}
          >
            {columns[3]?.map((url, i) => (
              <div
                key={`col3-${i}`}
                className={`relative shrink-0 overflow-hidden bg-surface-raised ${
                  i % 2 === 1 ? "aspect-3/4" : "aspect-square"
                }`}
              >
                <img
                  alt=""
                  className="size-full object-cover brightness-95 contrast-105"
                  decoding="async"
                  loading="eager"
                  src={url}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 左侧平滑非线性渐变蒙版 */}
      <div className="absolute inset-y-0 left-0 z-20 w-36 bg-linear-to-r from-surface via-surface/85 to-transparent sm:w-52 lg:w-72" />
      {/* 顶部柔和渐变蒙版 */}
      <div className="absolute inset-x-0 top-0 z-20 h-28 bg-linear-to-b from-surface via-surface/60 to-transparent" />
      {/* 底部柔和渐变蒙版 */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-32 bg-linear-to-t from-surface via-surface/70 to-transparent" />
    </div>
  );
}
