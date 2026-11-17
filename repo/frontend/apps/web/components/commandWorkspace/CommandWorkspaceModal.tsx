"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CommandWorkspaceCommand } from "@/components/commandWorkspace/CommandWorkspaceCommand";
import { CommandWorkspaceDirectSearch } from "@/components/commandWorkspace/CommandWorkspaceDirectSearch";
import { useSearchStore } from "@/store/module/search";
import { useFoliaPlaybackControlsStore } from "@/store/module/foliaPlaybackControls";
import { cn } from "@/lib/utils";
import type {
  CommandWorkspaceModalProps,
  CommandWorkspacePage,
  CommandWorkspaceSessionProps,
} from "@/types/commandWorkspace/model";

export function CommandWorkspaceModal({ isOpen, onClose }: CommandWorkspaceModalProps) {
  const persistedQuery = useSearchStore((state) => state.query);
  const setGlobalQuery = useSearchStore((state) => state.setQuery);
  const setIsSearching = useSearchStore((state) => state.setIsSearching);
  const launch = useFoliaPlaybackControlsStore((state) => state.commandWorkspaceLaunch);

  useEffect(() => {
    setIsSearching(isOpen);
    if (!isOpen && launch) useFoliaPlaybackControlsStore.getState().clearCommandWorkspaceLaunch();
  }, [isOpen, launch, setIsSearching]);

  const dismiss = () => {
    if (useSearchStore.getState().query.trimStart().startsWith(">")) setGlobalQuery("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <CommandWorkspaceSession initialQuery={persistedQuery} launch={launch} onClose={dismiss} />
      ) : null}
    </AnimatePresence>
  );
}

function CommandWorkspaceSession({ initialQuery, launch, onClose }: CommandWorkspaceSessionProps) {
  const setGlobalQuery = useSearchStore((state) => state.setQuery);
  const [mode, setMode] = useState<"command" | "direct">(
    launch || initialQuery.trimStart().startsWith(">") ? "command" : "direct",
  );
  const [page, setPage] = useState<CommandWorkspacePage>(launch?.page ?? "root");
  const enterCommand = () => {
    setGlobalQuery("");
    setPage("root");
    setMode("command");
  };

  const leaveCommand = () => {
    setGlobalQuery("");
    setMode("direct");
  };

  const previewMode =
    mode === "command" && (page === "folia-visualizers" || page === "folia-subtitles");
  const frame =
    mode === "command" && launch?.page !== "folia-subtitles" ? launch?.frame : undefined;
  const panelOrigin = frame
    ? `inset(max(0px, calc(100% - ${frame.height}px)) max(0px, calc((100% - ${frame.width}px) / 2)) 0px max(0px, calc((100% - ${frame.width}px) / 2)) round 999px)`
    : undefined;
  const panelOpen =
    "inset(max(0px, calc(0% - 0px)) max(0px, calc((0% - 0px) / 2)) 0px max(0px, calc((0% - 0px) / 2)) round 16px)";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className={cn("fixed inset-0", previewMode ? "z-150" : "z-240 bg-overlay backdrop-blur-md")}
        onMouseDown={onClose}
      />
      <motion.section
        initial={
          frame ? { opacity: 0, clipPath: panelOrigin } : { opacity: 0, scale: 0.97, y: -20 }
        }
        animate={frame ? { opacity: 1, clipPath: panelOpen } : { opacity: 1, scale: 1, y: 0 }}
        exit={frame ? { opacity: 0, clipPath: panelOrigin } : { opacity: 0, scale: 0.97, y: -12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2",
          previewMode ? "z-150" : "z-240",
          !frame && "top-[14vh] left-1/2",
        )}
        style={frame ? { bottom: frame.bottom, left: frame.centerX } : undefined}
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="命令工作区"
        role="dialog"
        aria-modal="true"
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-overlay/95 shadow-floating backdrop-blur-2xl">
          {mode === "direct" ? (
            <CommandWorkspaceDirectSearch
              initialQuery={initialQuery}
              onClose={onClose}
              onEnterCommand={enterCommand}
            />
          ) : (
            <CommandWorkspaceCommand
              onClose={onClose}
              onLeaveCommand={leaveCommand}
              page={page}
              setPage={setPage}
            />
          )}
        </div>
      </motion.section>
    </>
  );
}
