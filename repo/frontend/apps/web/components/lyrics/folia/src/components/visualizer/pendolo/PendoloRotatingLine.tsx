import React from "react";
import { motion, useTransform } from "framer-motion";
import type { PendoloRotatingLineProps } from "@/types/lyrics/folia/pendoloClockwork";

/** Keeps a line attached to the rail and fades it before it reaches the camera in hub view. */
const PendoloRotatingLine: React.FC<PendoloRotatingLineProps> = ({
  wheelRotationDeg,
  mirrored,
  railWidth,
  baseAngleDeg,
  baseOpacity,
  left,
  top,
  standUp,
  fontFamily,
  fontWeight,
  onClick,
  children,
}) => {
  const opacity = useTransform(wheelRotationDeg, (rotation) => {
    if (!standUp) return baseOpacity;
    const angle = Math.abs(baseAngleDeg + (mirrored ? -rotation : rotation));
    return baseOpacity * Math.max(0, Math.min(1, (75 - angle) / 10));
  });
  const standPointerEvents = useTransform(opacity, (value) => (value < 0.01 ? "none" : "auto"));

  return (
    <motion.div
      className={`pointer-events-auto absolute ${onClick ? "cursor-pointer" : ""}`}
      style={{
        left: mirrored ? "auto" : left,
        right: mirrored ? railWidth - left : "auto",
        top,
        transformOrigin: `${mirrored ? "right" : "left"} ${standUp ? "top" : "center"}`,
        rotate: standUp?.rotationDeg ?? 0,
        rotateX: standUp?.tiltDeg ?? 0,
        pointerEvents: standUp ? standPointerEvents : "auto",
        opacity,
        fontFamily,
        fontWeight,
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default React.memo(PendoloRotatingLine);
