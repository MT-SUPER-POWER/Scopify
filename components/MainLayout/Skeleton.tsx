"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

interface MainLayoutSkeletonProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Loading shell for the desktop layout.
 */
export default function MainLayoutSkeleton({
  title,
  description,
  actionLabel,
  onAction,
}: MainLayoutSkeletonProps) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "relative w-full h-dvh flex flex-col bg-black text-white font-sans",
        "overflow-hidden select-none p-2 gap-2",
      )}
    >
      <motion.div
        className="h-16 bg-linear-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-lg"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="flex-1 flex gap-2 min-h-0">
        <motion.div
          className="w-1/5 bg-linear-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-lg"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="flex-1 bg-linear-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-lg"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <motion.div
        className="h-20 bg-linear-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-lg"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
        <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-black/70 p-6 text-center shadow-2xl backdrop-blur-xl">
          <div className="text-lg font-semibold text-white">
            {title ?? t("layout.loadingTitle")}
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {description ?? t("layout.loadingDescription")}
          </p>
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
    </div>
  );
}
