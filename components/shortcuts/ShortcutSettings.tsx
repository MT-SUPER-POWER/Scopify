"use client";

import { RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SHORTCUT_GROUP_LABEL_KEYS, SHORTCUT_GROUPS } from "@/constants/shortcuts";
import { Input } from "@/components/ui/input";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { useI18n } from "@/store/module/i18n";
import { ShortcutBindingRow } from "./ShortcutBindingRow";

export function ShortcutSettings() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const { commands, assignShortcut, disableShortcut, resetShortcut, resetAllShortcuts } =
    useShortcutRegistry();
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const groups = useMemo(
    () =>
      SHORTCUT_GROUPS.map((group) => ({
        group,
        commands: commands.filter((command) => {
          if (command.group !== group) return false;
          return (
            !normalizedQuery || t(command.labelKey).toLocaleLowerCase().includes(normalizedQuery)
          );
        }),
      })).filter(({ commands: groupedCommands }) => groupedCommands.length > 0),
    [commands, normalizedQuery, t],
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{t("shortcuts.title")}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t("shortcuts.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={resetAllShortcuts}
          className="inline-flex items-center justify-center gap-2 rounded bg-white px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          <RotateCcw className="size-4" />
          {t("shortcuts.resetAll")}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("shortcuts.searchPlaceholder")}
          className="border-white/10 bg-black/20 pl-9 text-white placeholder:text-zinc-500"
        />
      </div>

      <div className="space-y-7">
        {groups.map(({ group, commands: groupedCommands }) => (
          <div key={group}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase">
              {t(SHORTCUT_GROUP_LABEL_KEYS[group])}
            </h3>
            <div className="mt-2">
              {groupedCommands.map((command) => (
                <ShortcutBindingRow
                  key={command.id}
                  command={command}
                  binding={command.binding}
                  isCustomized={command.isCustomized}
                  onAssign={(binding) => assignShortcut(command.id, binding)}
                  onDisable={() => disableShortcut(command.id)}
                  onReset={() => resetShortcut(command.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
