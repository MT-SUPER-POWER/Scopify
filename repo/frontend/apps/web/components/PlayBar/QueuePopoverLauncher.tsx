"use client";

import { AnimatePresence, motion } from "motion/react";
import { QueuePopover } from "@/components/player/QueuePopover";

export function QueuePopoverLauncher() {
  return (
    <div className="hidden md:block">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="z-2000"
          style={{ position: "relative" }}
        >
          <QueuePopover />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
