import type { AppCloseAction } from "@/lib/runtime/types";

interface AppCloseActionsProps {
  disabled: boolean;
  exitLabel: string;
  minimizeLabel: string;
  onAction: (action: AppCloseAction) => void;
}

export function AppCloseActions({
  disabled,
  exitLabel,
  minimizeLabel,
  onAction,
}: AppCloseActionsProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction("minimize")}
        className="w-full rounded-full bg-brand py-3.5 text-base font-bold text-brand-foreground transition-all hover:scale-105 hover:bg-brand-hover active:scale-100 disabled:pointer-events-none disabled:opacity-60"
      >
        {minimizeLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction("exit")}
        className="w-full rounded-full border border-content-subtle bg-transparent py-3.5 text-base font-bold text-content transition-all hover:scale-105 hover:border-content hover:bg-content/5 active:scale-100 disabled:pointer-events-none disabled:opacity-60"
      >
        {exitLabel}
      </button>
    </div>
  );
}
