"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CommandWorkspaceCommand } from "@/components/commandWorkspace/CommandWorkspaceCommand";
import { CommandWorkspaceDirectSearch } from "@/components/commandWorkspace/CommandWorkspaceDirectSearch";
import { useSearchStore } from "@/store/module/search";
import type { CommandWorkspaceModalProps } from "@/types/commandWorkspace";

export function CommandWorkspaceModal({ isOpen, onClose }: CommandWorkspaceModalProps) {
  const persistedQuery = useSearchStore((state) => state.query);
  const setGlobalQuery = useSearchStore((state) => state.setQuery);
  const setIsSearching = useSearchStore((state) => state.setIsSearching);
  const [mode, setMode] = useState<"command" | "direct">("direct");
  const shouldSyncModeOnOpen = useRef(true);

  useEffect(() => {
    setIsSearching(isOpen);
    if (!isOpen) {
      shouldSyncModeOnOpen.current = true;
      return;
    }
    if (!shouldSyncModeOnOpen.current) return;
    setMode(persistedQuery.trimStart().startsWith(">") ? "command" : "direct");
    shouldSyncModeOnOpen.current = false;
  }, [isOpen, persistedQuery, setIsSearching]);

  const dismiss = () => {
    setGlobalQuery("");
    onClose();
  };

  const enterCommand = () => {
    setGlobalQuery("");
    setMode("command");
  };

  const leaveCommand = () => {
    setGlobalQuery("");
    setMode("direct");
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            onMouseDown={dismiss}
          />
          <motion.section
            initial={{ opacity: 0, scale: 0.97, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[14vh] left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4"
            onMouseDown={(event) => event.stopPropagation()}
            aria-label="命令工作区"
            role="dialog"
            aria-modal="true"
          >
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.07] shadow-[0_32px_64px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl">
              {mode === "direct" ? (
                <CommandWorkspaceDirectSearch
                  initialQuery={persistedQuery}
                  onClose={dismiss}
                  onEnterCommand={enterCommand}
                />
              ) : (
                <CommandWorkspaceCommand onClose={dismiss} onLeaveCommand={leaveCommand} />
              )}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
