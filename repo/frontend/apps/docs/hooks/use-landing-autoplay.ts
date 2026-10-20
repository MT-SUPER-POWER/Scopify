"use client";

import { useCallback, useEffect, useState } from "react";

import { LANDING_SONG_DURATION } from "@/constants/marketing";

const PLAYER_SELECTOR = "[data-landing-player]";

/**
 * 迷你播放器的「播放」：让页面按一首歌的时长自己往下滚。
 * 用户一旦滚轮、触摸或按键，就把控制权还给用户。
 */
export function useLandingAutoplay() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    let frameId = 0;
    let lastFrame = performance.now();
    let carry = 0;
    const stop = () => setIsPlaying(false);
    const stopOnKey = (event: KeyboardEvent) => {
      if (!(event.target instanceof Element && event.target.closest(PLAYER_SELECTOR))) stop();
    };

    const step = (now: number) => {
      const deltaSeconds = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 1) {
        stop();
        return;
      }

      carry += (maxScroll / LANDING_SONG_DURATION) * deltaSeconds;
      const distance = Math.floor(carry);
      if (distance > 0) {
        window.scrollBy({ top: distance, behavior: "instant" });
        carry -= distance;
      }
      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stopOnKey);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stopOnKey);
    };
  }, [isPlaying]);

  const toggle = useCallback(() => setIsPlaying((playing) => !playing), []);

  return { isPlaying, toggle };
}
