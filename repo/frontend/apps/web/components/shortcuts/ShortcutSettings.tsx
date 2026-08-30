"use client";

import { RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SHORTCUT_GROUP_LABEL_KEYS, SHORTCUT_GROUPS } from "@/constants/shortcuts";
import { Input } from "@/components/ui/input";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { useI18n } from "@/store/module/i18n";
import { SettingSection } from "@/components/settings/SettingsUI";
import { ShortcutBindingRow } from "./ShortcutBindingRow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    <section className="space-y-10">
      <div className="flex w-full items-center gap-2 sm:w-80">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("shortcuts.searchPlaceholder")}
            className="w-full border-input bg-transparent pl-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              title={t("shortcuts.resetAll")}
              aria-label={t("shortcuts.resetAll")}
              className="flex size-9 shrink-0 items-center justify-center rounded border border-input text-muted-foreground transition-colors hover:border-content hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <RotateCcw className="size-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>恢复全部默认值</AlertDialogTitle>
              <AlertDialogDescription>
                确定要清除所有自定义的快捷键绑定吗？此操作将恢复系统默认设置，且无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.action.cancel") || "取消"}</AlertDialogCancel>
              <AlertDialogAction onClick={resetAllShortcuts}>
                {t("common.action.confirm") || "确定"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
        {groups.map(({ group, commands: groupedCommands }) => (
          <SettingSection key={group} title={t(SHORTCUT_GROUP_LABEL_KEYS[group])}>
            <div className="flex flex-col">
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
          </SettingSection>
        ))}
      </div>
    </section>
  );
}
