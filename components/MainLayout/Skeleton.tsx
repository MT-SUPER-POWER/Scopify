"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MainLayoutSkeletonProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  content?: ReactNode;
}

/**
 * Loading shell for the desktop layout.
 * When `title` is omitted, renders as a silent skeleton (no overlay text).
 */
export default function MainLayoutSkeleton({
  title,
  description,
  actionLabel,
  onAction,
  content,
}: MainLayoutSkeletonProps) {
  return (
    <div
      className={cn(
        "relative flex h-dvh w-full flex-col bg-black font-sans text-white",
        "gap-2 overflow-hidden p-2 select-none",
      )}
    >
      <motion.div
        className="h-16 rounded-lg bg-linear-to-r from-zinc-900 via-zinc-800 to-zinc-900"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="flex min-h-0 flex-1 gap-2">
        <motion.div
          className="w-1/5 rounded-lg bg-linear-to-r from-zinc-900 via-zinc-800 to-zinc-900"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {content ? (
          <div className="flex-1 overflow-hidden rounded-lg bg-[#121212]">{content}</div>
        ) : (
          <motion.div
            className="flex-1 rounded-lg bg-linear-to-r from-zinc-900 via-zinc-800 to-zinc-900"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      <motion.div
        className="h-20 rounded-lg bg-linear-to-r from-zinc-900 via-zinc-800 to-zinc-900"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {title ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-black/70 p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="text-lg font-semibold text-white">{title}</div>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
            ) : null}
            {actionLabel && onAction ? (
              <button
                type="button"
                onClick={onAction}
                className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
