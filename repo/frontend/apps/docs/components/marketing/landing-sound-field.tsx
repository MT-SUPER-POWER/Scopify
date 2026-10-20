"use client";

import { useRef } from "react";

import { useSoundField } from "@/hooks/use-sound-field";

/** 固定在整页背后的 WebGL 声场；不支持 WebGL2 时露出下面的静态渐变。 */
export function LandingSoundField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useSoundField(canvasRef);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_10%,#13264a_0%,#05060b_62%)]"
    >
      <canvas ref={canvasRef} className="size-full" />
      <div className="landing-grain absolute inset-0" />
    </div>
  );
}
