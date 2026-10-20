"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface LandingRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** 进入视口时从模糊中浮现，落地页各章节标题共用。 */
export function LandingReveal({ children, className, delay = 0 }: LandingRevealProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  if (prefersReducedMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
