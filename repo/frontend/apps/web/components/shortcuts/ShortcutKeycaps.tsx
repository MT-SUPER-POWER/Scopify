import { getShortcutBindingParts } from "@/lib/shortcuts/bindings";
import type { ShortcutBinding } from "@/types/shortcuts";

interface ShortcutKeycapsProps {
  binding: ShortcutBinding;
}

export function ShortcutKeycaps({ binding }: ShortcutKeycapsProps) {
  return (
    <span
      className="flex shrink-0 items-center gap-1"
      aria-label={getShortcutBindingParts(binding).join(" + ")}
    >
      {getShortcutBindingParts(binding).map((part) => (
        <kbd
          key={part}
          className="min-w-6 rounded-md border border-[#3d3d3d] bg-[#292929] px-2 py-0.5 text-center font-mono text-[12px] leading-4 font-medium text-[#bcbcbc] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          {part}
        </kbd>
      ))}
    </span>
  );
}
