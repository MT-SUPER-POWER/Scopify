import { cn } from "@/lib/utils";
import { motion } from "motion/react";

/**
 *
 * @returns 播放器骨架屏组件
 */
export default function MainLayoutSkeleton() {
  return (
    <div className={cn(
      "w-full h-dvh flex flex-col bg-black text-white font-sans",
      "overflow-hidden select-none p-2 gap-2"
    )}>
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
    </div>
  );
}
