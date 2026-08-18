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
          className="fixed inset-0 z-120 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onMouseDown={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-2xl rounded-lg border border-border bg-surface-overlay p-5 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <Keyboard className="size-5 text-brand" />
                <h2 className="text-lg font-bold">{t("shortcuts.help.title")}</h2>
              </div>
              <button
                type="button"
                title={t("common.action.close")}
                aria-label={t("common.action.close")}
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                      {t(SHORTCUT_GROUP_LABEL_KEYS[group])}
                    </h3>
                    <div className="mt-2 space-y-2">
                      {groupCommands.map((command) => (
                        <div
                          key={command.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="truncate text-foreground">{t(command.labelKey)}</span>
                          <kbd className="shrink-0 rounded border border-border bg-muted px-2 py-1 text-xs text-foreground">
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
