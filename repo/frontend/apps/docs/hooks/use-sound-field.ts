"use client";

import { useReducedMotion } from "framer-motion";
import { type RefObject, useEffect } from "react";

import { useLandingAtmosphere } from "@/hooks/use-landing-atmosphere";
import { writePaletteRgb } from "@/lib/marketing/landing-palette";
import { createSoundFieldRenderer } from "@/lib/marketing/sound-field-renderer";

/** 声场画面本身足够柔和，按半分辨率渲染后由浏览器放大即可，且总像素数封顶。 */
const RENDER_SCALE = 0.5;
const MAX_RENDER_PIXELS = 900 * 560;
const STATIC_TIME = 18;

const approach = (current: number, target: number, rate: number, deltaSeconds: number) =>
  current + (target - current) * (1 - Math.exp(-rate * deltaSeconds));

/** 把落地页氛围目标逐帧缓动到 WebGL 声场上：调色板、亮度、滚动漂移与指针视差。 */
export function useSoundField(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const { targetRef } = useLandingAtmosphere();
  const prefersReducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createSoundFieldRenderer(canvas);
    if (!renderer) return;

    const palette = new Float32Array(12);
    const targetPalette = new Float32Array(12);
    writePaletteRgb(targetRef.current.palette, palette);
    let intensity = targetRef.current.intensity;
    const pointer: [number, number] = [0, 0];
    const pointerTarget: [number, number] = [0, 0];
    let drift = window.scrollY / window.innerHeight;
    let spotlight = targetRef.current.spotlight;
    let needsRender = true;
    const startedAt = performance.now();
    let lastFrame = startedAt;
    let frameId = 0;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scale = Math.min(RENDER_SCALE, Math.sqrt(MAX_RENDER_PIXELS / (width * height)));
      renderer.resize(
        Math.max(1, Math.round(width * scale)),
        Math.max(1, Math.round(height * scale)),
      );
      needsRender = true;
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerTarget[0] = (event.clientX / window.innerWidth) * 2 - 1;
      pointerTarget[1] = 1 - (event.clientY / window.innerHeight) * 2;
    };

    const frame = (now: number) => {
      frameId = requestAnimationFrame(frame);
      const deltaSeconds = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const target = targetRef.current;

      writePaletteRgb(target.palette, targetPalette);
      let paletteDistance = 0;
      for (let index = 0; index < palette.length; index += 1) {
        palette[index] = approach(palette[index]!, targetPalette[index]!, 1.6, deltaSeconds);
        paletteDistance += Math.abs(targetPalette[index]! - palette[index]!);
      }
      intensity = approach(intensity, target.intensity, 1.6, deltaSeconds);
      // 追光像舞台灯一样有一点点亮起的延迟，而不是跟着滚动生硬跳变。
      spotlight = approach(spotlight, target.spotlight, 3, deltaSeconds);
      const isSettling =
        paletteDistance > 0.003 ||
        Math.abs(target.intensity - intensity) > 0.002 ||
        Math.abs(target.spotlight - spotlight) > 0.002;

      if (prefersReducedMotion) {
        if (!isSettling && !needsRender) return;
        needsRender = false;
        renderer.render({
          drift: 0,
          intensity,
          palette,
          pointer,
          spotlight,
          time: STATIC_TIME,
        });
        return;
      }

      // 指针与滚动都只做缓慢跟随，让画面始终是平滑流动而不是抖动。
      pointer[0] = approach(pointer[0], pointerTarget[0], 1.2, deltaSeconds);
      pointer[1] = approach(pointer[1], pointerTarget[1], 1.2, deltaSeconds);
      drift = approach(drift, window.scrollY / window.innerHeight, 2.5, deltaSeconds);

      renderer.render({
        drift,
        intensity,
        palette,
        pointer,
        spotlight,
        time: (now - startedAt) / 1000,
      });
    };

    resize();
    frameId = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      renderer.dispose();
    };
  }, [canvasRef, prefersReducedMotion, targetRef]);
}
