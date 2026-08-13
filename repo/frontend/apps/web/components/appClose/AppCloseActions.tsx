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
        className="bg-brand text-brand-foreground hover:bg-brand-hover w-full rounded-full py-3.5 text-base font-bold transition-all hover:scale-105 active:scale-100 disabled:pointer-events-none disabled:opacity-60"
      >
        {minimizeLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction("exit")}
        className="border-content-subtle text-content hover:border-content hover:bg-content/5 w-full rounded-full border bg-transparent py-3.5 text-base font-bold transition-all hover:scale-105 active:scale-100 disabled:pointer-events-none disabled:opacity-60"
      >
        {exitLabel}
      </button>
    </div>
  );
}
