"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { ShortcutHelpSection } from "@/components/shortcuts/ShortcutHelpSection";
import { SHORTCUT_GROUP_LABEL_KEYS, SHORTCUT_GROUPS } from "@/constants/shortcuts";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { ShortcutCommandId } from "@/types/shortcuts";
import type { ShortcutHelpCommand } from "@/types/components/shortcuts";

const RECOMMENDED_COMMAND_IDS = [
  "open-command-palette",
  "open-search",
  "toggle-playback",
  "toggle-queue",
] as const satisfies readonly ShortcutCommandId[];

export function KeyboardShortcutHelp() {
  const { t } = useI18n();
  const isOpen = useUiStore((state) => state.isShortcutHelpOpen);
  const setIsOpen = useUiStore((state) => state.setIsShortcutHelpOpen);
  const { commands } = useShortcutRegistry();
  const visibleCommands = commands.filter(
    (command): command is ShortcutHelpCommand => command.binding !== null,
  );
  const recommendedCommands = RECOMMENDED_COMMAND_IDS.flatMap((id) => {
    const command = visibleCommands.find((candidate) => candidate.id === id);
    return command ? [command] : [];
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-120 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[min(78dvh,720px)] max-h-[calc(100dvh-2rem)] w-full max-w-[806px] [scrollbar-color:#4a4a4a_transparent] [scrollbar-gutter:stable] overflow-y-auto rounded-2xl border border-white/8 bg-[#111] px-5 pt-[18px] pb-10 text-[#d2d2d2] shadow-[0_28px_80px_rgba(0,0,0,0.52)] sm:px-[72px] [&::-webkit-scrollbar]:w-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[5px] [&::-webkit-scrollbar-thumb]:border-[#111] [&::-webkit-scrollbar-thumb]:bg-[#4a4a4a]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2 className="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-[#d2d2d2]">
                  {t("shortcuts.help.panelTitle")}
                </h2>
                <p className="mt-1 text-[15px] leading-5 text-[#7f7f7f]">
                  {t("shortcuts.help.subtitle")}
                </p>
              </div>
              <button
                type="button"
                title={t("common.action.close")}
                aria-label={t("common.action.close")}
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-6 flex size-8 items-center justify-center rounded text-[#bababa] transition-colors hover:bg-white/8 hover:text-white"
              >
                <X className="size-[18px] stroke-[1.5]" />
              </button>
            </header>
            <div className="mt-6 max-w-[620px] space-y-4">
              {recommendedCommands.length > 0 ? (
                <ShortcutHelpSection
                  commands={recommendedCommands}
                  title={t("shortcuts.help.recommended")}
                />
              ) : null}
              {SHORTCUT_GROUPS.map((group) => {
                const groupCommands = visibleCommands.filter((command) => command.group === group);
                if (!groupCommands.length) return null;

                return (
                  <ShortcutHelpSection
                    key={group}
                    commands={groupCommands}
                    title={t(SHORTCUT_GROUP_LABEL_KEYS[group])}
                  />
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
