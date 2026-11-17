"use client";

import { memo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";

import type { RadioWallMetrics } from "@/types/playlist/radioWall";

interface RadioWallBackdropProps {
  metrics: RadioWallMetrics;
  rail: MotionValue<number>;
  reducedMotion: boolean | null;
}

export const RadioWallBackdrop = memo(function RadioWallBackdrop({
  metrics,
  rail,
  reducedMotion,
}: RadioWallBackdropProps) {
  const { centerX, centerY, cardSize, radius, width, height } = metrics;
  const pivotY = centerY + radius + cardSize * 0.12;
  const rotation = useTransform(rail, (value) => (value % 120) * 3);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_28%,var(--secondary),var(--card)_78%)]"
    >
      <motion.div
        className="absolute inset-0 origin-center"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          className="absolute inset-0 motion-safe:will-change-transform"
          style={{
            rotate: reducedMotion ? 0 : rotation,
            transformOrigin: `${centerX}px ${pivotY}px`,
          }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="size-full overflow-visible fill-none text-content/15"
          >
            <circle
              cx={centerX}
              cy={pivotY}
              r={radius + cardSize * 0.37}
              stroke="currentColor"
              strokeDasharray="1 6"
            />
            <circle cx={centerX} cy={pivotY} r={radius + cardSize * 0.2} stroke="currentColor" />
            <circle cx={centerX} cy={pivotY} r={radius - cardSize * 0.36} stroke="currentColor" />
            <circle
              cx={centerX}
              cy={pivotY}
              r={radius - cardSize * 0.51}
              stroke="currentColor"
              strokeDasharray="2 8"
            />
          </svg>
        </motion.div>
      </motion.div>
      <div
        className="absolute left-1/2 h-3 w-0.5 -translate-x-1/2 rounded-full bg-primary"
        style={{ top: Math.max(10, centerY - cardSize / 2 - 24) }}
      />
    </div>
  );
});
