"use client";

import { CircleOff, Pencil, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ShortcutCommandIcon } from "@/components/shortcuts/ShortcutCommandIcon";
import { ShortcutKeycaps } from "@/components/shortcuts/ShortcutKeycaps";
import { SHORTCUT_COMMANDS } from "@/constants/shortcuts";
import { getShortcutBindingFromEvent } from "@/lib/shortcuts/bindings";
import { useI18n } from "@/store/module/i18n";
import type { ShortcutBindingRowProps } from "@/types/components/shortcuts";

export function ShortcutBindingRow({
  command,
  binding,
  isCustomized,
  onAssign,
  onDisable,
  onReset,
}: ShortcutBindingRowProps) {
  const { t } = useI18n();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isRecording) return;

    event.preventDefault();
    const nextBinding = getShortcutBindingFromEvent(event.nativeEvent);
    if (!nextBinding) {
      setError(t("shortcuts.invalidBinding"));
      return;
    }

    const result = onAssign(nextBinding);
    if (!result.ok) {
      const conflict = SHORTCUT_COMMANDS.find(
        (candidate) => candidate.id === result.conflictCommandId,
      );
      setError(t("shortcuts.conflict", { command: conflict ? t(conflict.labelKey) : "" }));
      return;
    }

    setError(null);
    setIsRecording(false);
  };

  return (
    <div className="grid gap-3 py-2.5 first:pt-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <ShortcutCommandIcon
            commandId={command.id}
            className="size-4 shrink-0 text-muted-foreground"
          />
          <p className="truncate text-sm leading-5 font-medium text-foreground">
            {t(command.labelKey)}
          </p>
        </div>
        {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
      </div>
      <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-68">
        <div className="flex min-h-8 flex-1 items-center justify-end px-3 text-right text-sm text-foreground">
          {isRecording ? (
            <span className="animate-pulse text-muted-foreground" aria-live="polite">
              {t("shortcuts.recording")}
            </span>
          ) : binding ? (
            <ShortcutKeycaps binding={binding} />
          ) : (
            t("shortcuts.unassigned")
          )}
        </div>
        {/* 快捷键相关控制按钮 */}
        <button
          type="button"
          title={t("shortcuts.disable")}
          aria-label={t("shortcuts.disable")}
          onClick={() => {
            setError(null);
            onDisable();
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <CircleOff className="size-4" />
        </button>
        <button
          type="button"
          title={t("shortcuts.reset")}
          aria-label={t("shortcuts.reset")}
          onClick={() => {
            setError(null);
            onReset();
          }}
          disabled={!isCustomized}
          className="flex size-8 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <RotateCcw className="size-4" />
        </button>
        <button
          type="button"
          title={t("shortcuts.edit")}
          aria-label={t("shortcuts.edit")}
          onClick={() => {
            setError(null);
            setIsRecording(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setIsRecording(false)}
          className="flex size-8 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Pencil className="size-4" />
        </button>
      </div>
    </div>
  );
}
