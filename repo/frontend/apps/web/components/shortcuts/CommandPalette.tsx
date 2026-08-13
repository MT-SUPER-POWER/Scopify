"use client";

import { Command, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";

export function CommandPalette() {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const isOpen = useUiStore((state) => state.isCommandPaletteOpen);
  const setIsOpen = useUiStore((state) => state.setIsCommandPaletteOpen);
  const commands = useShortcutRegistry().commands;
  const executeShortcutCommand = useShortcutCommands();
  const matches = useMemo(
    () =>
      commands.filter(
        (command) =>
          (command.scope ?? "global") === "global" &&
          t(command.labelKey).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
      ),
    [commands, query, t],
  );

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const run = (commandId: (typeof commands)[number]["id"]) => {
    executeShortcutCommand(commandId);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setIsOpen(false);
      return;
    }
    if (event.key === "Enter" && matches[0]) {
      event.preventDefault();
      run(matches[0].id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-120 flex items-start justify-center bg-black/70 px-4 pt-[14vh] backdrop-blur-sm"
          onMouseDown={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="w-full max-w-xl overflow-hidden rounded-lg border border-white/15 bg-[#181818] shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Command className="size-5 text-[#1db954]" />
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-zinc-500" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("shortcuts.commandPalette.placeholder")}
                  className="w-full bg-transparent pl-7 text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>
              <button
                type="button"
                title={t("common.action.close")}
                aria-label={t("common.action.close")}
                onClick={() => setIsOpen(false)}
                className="flex size-7 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {matches.length ? (
                matches.map((command) => (
                  <button
                    key={command.id}
                    type="button"
                    onClick={() => run(command.id)}
                    className="flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-sm text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <span>{t(command.labelKey)}</span>
                    {command.binding ? (
                      <kbd className="text-xs text-zinc-500">
                        {getShortcutBindingLabel(command.binding)}
                      </kbd>
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="px-3 py-8 text-center text-sm text-zinc-500">
                  {t("shortcuts.commandPalette.empty")}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
