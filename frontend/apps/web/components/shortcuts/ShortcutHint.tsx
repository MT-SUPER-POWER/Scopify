"use client";

import type { ReactNode } from "react";

import { getEffectiveShortcutBinding, getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
import { useShortcutStore } from "@/store/module/shortcuts";
import type { ShortcutCommandId } from "@/types/shortcuts";

interface ShortcutHintProps {
  commandId?: ShortcutCommandId;
  label: ReactNode;
}

/** Renders an action label with its effective, user-customized shortcut. */
export function ShortcutHint({ commandId, label }: ShortcutHintProps) {
  const overrides = useShortcutStore((state) => state.overrides);
  const binding = commandId ? getEffectiveShortcutBinding(commandId, overrides) : null;
  const shortcutLabel = getShortcutBindingLabel(binding);

  return (
    <span className="flex items-center gap-3 whitespace-nowrap">
      <span>{label}</span>
      {shortcutLabel ? (
        <kbd className="bg-background/15 rounded px-1.5 py-0.5 font-sans text-[10px] font-medium tabular-nums">
          {shortcutLabel}
        </kbd>
      ) : null}
    </span>
  );
}
