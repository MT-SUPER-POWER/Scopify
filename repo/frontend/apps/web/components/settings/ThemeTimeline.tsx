import { formatThemeTime } from "@/lib/settings/appearance";
import type { ThemeTimelineProps } from "@/types/appearance";

export function ThemeTimeline({ slots, options }: ThemeTimelineProps) {
  return (
    <div className="space-y-2">
      <div aria-hidden className="flex h-14 overflow-hidden rounded-lg border border-border">
        {slots.map((slot, index) => {
          const theme = options.find(({ id }) => id === slot.themeId);
          const end = slots[index + 1]?.start ?? 1440;
          return (
            <div
              key={index}
              title={`${formatThemeTime(slot.start)}–${formatThemeTime(end)} · ${theme?.name}`}
              className="min-w-0 border-r border-white/15 last:border-0"
              style={{
                flex: Math.max(0, end - slot.start),
                background: `linear-gradient(135deg, ${theme?.top ?? "#92999D"}, ${theme?.bottom ?? "#454B50"})`,
              }}
            />
          );
        })}
      </div>
      <div aria-hidden className="flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
}
