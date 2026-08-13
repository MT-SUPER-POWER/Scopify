"use client";

import { Keyboard, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { SHORTCUT_GROUP_LABEL_KEYS, SHORTCUT_GROUPS } from "@/constants/shortcuts";
import { getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";

export function KeyboardShortcutHelp() {
  const { t } = useI18n();
  const isOpen = useUiStore((state) => state.isShortcutHelpOpen);
  const setIsOpen = useUiStore((state) => state.setIsShortcutHelpOpen);
  const { commands } = useShortcutRegistry();

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
          className="bg-background/80 fixed inset-0 z-120 flex items-center justify-center p-4 backdrop-blur-sm"
          onMouseDown={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="border-border bg-surface-overlay w-full max-w-2xl rounded-lg border p-5 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-foreground flex items-center gap-2">
                <Keyboard className="text-brand size-5" />
                <h2 className="text-lg font-bold">{t("shortcuts.help.title")}</h2>
              </div>
              <button
                type="button"
                title={t("common.action.close")}
                aria-label={t("common.action.close")}
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-8 items-center justify-center rounded"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {SHORTCUT_GROUPS.map((group) => {
                const groupCommands = commands.filter(
                  (command) => command.group === group && command.binding,
                );
                if (!groupCommands.length) return null;

                return (
                  <section key={group}>
                    <h3 className="text-muted-foreground text-xs font-semibold uppercase">
                      {t(SHORTCUT_GROUP_LABEL_KEYS[group])}
                    </h3>
                    <div className="mt-2 space-y-2">
                      {groupCommands.map((command) => (
                        <div
                          key={command.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-foreground truncate">{t(command.labelKey)}</span>
                          <kbd className="bg-muted text-foreground border-border shrink-0 rounded border px-2 py-1 text-xs">
                            {getShortcutBindingLabel(command.binding)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
