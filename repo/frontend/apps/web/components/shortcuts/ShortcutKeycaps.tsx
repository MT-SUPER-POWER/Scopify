import { getShortcutBindingParts } from "@/lib/shortcuts/bindings";
import type { ShortcutKeycapsProps } from "@/types/shortcuts/components";

export function ShortcutKeycaps({ binding }: ShortcutKeycapsProps) {
  return (
    <span
      className="flex shrink-0 items-center gap-1"
      aria-label={getShortcutBindingParts(binding).join(" + ")}
    >
      {getShortcutBindingParts(binding).map((part) => (
        <kbd
          key={part}
          className="min-w-6 rounded-md border border-border bg-surface-elevated px-2 py-0.5 text-center font-mono text-[12px] leading-4 font-medium text-content-muted shadow-xs"
        >
          {part}
        </kbd>
      ))}
    </span>
  );
}
