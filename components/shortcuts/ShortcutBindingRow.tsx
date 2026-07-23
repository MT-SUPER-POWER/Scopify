"use client";

import { CircleOff, RotateCcw } from "lucide-react";
import { useState } from "react";
import { SHORTCUT_COMMANDS } from "@/constants/shortcuts";
import { getShortcutBindingFromEvent, getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
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
    <div className="grid gap-3 border-b border-white/8 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{t(command.labelKey)}</p>
        {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsRecording(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setIsRecording(false)}
          className="min-w-36 rounded border border-white/15 bg-black/20 px-3 py-1.5 text-sm text-white transition-colors hover:border-white/35 focus-visible:border-[#1db954] focus-visible:outline-none"
        >
          {isRecording
            ? t("shortcuts.recording")
            : binding
              ? getShortcutBindingLabel(binding)
              : t("shortcuts.unassigned")}
        </button>
        <button
          type="button"
          title={t("shortcuts.disable")}
          aria-label={t("shortcuts.disable")}
          onClick={() => {
            setError(null);
            onDisable();
          }}
          className="flex size-8 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
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
          className="flex size-8 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
    </div>
  );
}
