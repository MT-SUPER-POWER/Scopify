import { cn } from "@/lib/utils";
import type { AudioEqualizerPanelSectionProps } from "@/types/audio/equalizerPanelComponents";

// Folia's equalizer section heading and card.
export function AudioEqualizerSection({
  title,
  hint,
  announceHint,
  grow,
  children,
}: AudioEqualizerPanelSectionProps) {
  return (
    <section className={cn("mt-5 flex flex-col", grow && "flex-1")}>
      <div className="mb-2 flex min-h-6 items-center justify-between gap-3 px-1">
        <h3 className="text-[13px] leading-5 font-semibold text-[color:var(--st-t2)]">{title}</h3>
        {hint && (
          <span
            role={announceHint ? "status" : undefined}
            className="text-xs leading-[18px] text-[color:var(--st-t3)]"
          >
            {hint}
          </span>
        )}
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-xl bg-[var(--st-card)] shadow-[0_0_0_1px_var(--st-line)]",
          grow && "flex flex-1",
        )}
      >
        {children}
      </div>
    </section>
  );
}
