"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function DesktopWallpaperSpikeBackdrop() {
  const searchParams = useSearchParams();
  const transparent = searchParams.get("transparent") === "1";
  const movingGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("desktop-wallpaper-spike-html");
    document.body.classList.add("desktop-wallpaper-spike-body");

    let animationFrame = 0;
    const startedAt = performance.now();
    const renderFrame = (now: number) => {
      const glow = movingGlowRef.current;
      if (glow) {
        const elapsed = (now - startedAt) / 1_000;
        const x = Math.sin(elapsed * 0.23) * 28;
        const y = Math.cos(elapsed * 0.19) * 22;
        const scale = 0.94 + (Math.sin(elapsed * 0.31) + 1) * 0.08;
        glow.style.transform = `translate3d(${x}vw, ${y}vh, 0) scale(${scale})`;
      }
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    animationFrame = window.requestAnimationFrame(renderFrame);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.documentElement.classList.remove("desktop-wallpaper-spike-html");
      document.body.classList.remove("desktop-wallpaper-spike-body");
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${
        transparent
          ? "bg-transparent"
          : "bg-[radial-gradient(circle_at_18%_15%,#1d4ed8_0%,transparent_32%),linear-gradient(145deg,#020617_0%,#071a2e_46%,#111827_100%)]"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div
        ref={movingGlowRef}
        className="absolute top-[28%] left-[42%] size-[42vw] rounded-full bg-cyan-400/22 blur-[110px] will-change-transform"
      />
      <div className="absolute right-[-8vw] bottom-[-18vh] size-[52vw] rounded-full bg-violet-500/24 blur-[130px]" />
      <div className="absolute top-[16vh] left-[12vw] size-32 rotate-12 border border-white/20 bg-white/5 shadow-[0_0_80px_rgba(125,211,252,0.22)]" />
      <div className="absolute right-[18vw] bottom-[21vh] size-24 rounded-full border border-white/18 bg-white/4 shadow-[0_0_90px_rgba(167,139,250,0.28)]" />
    </div>
  );
}
