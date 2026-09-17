import { Plus, X } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { formatThemeTime } from "@/lib/settings/appearance";
import { useI18n } from "@/store/module/i18n";
import type { ThemeScheduleEditorProps } from "@/types/appearance";
import { ThemeTimeline } from "./ThemeTimeline";

export function ThemeScheduleEditor({ slots, options, onChange }: ThemeScheduleEditorProps) {
  const { t } = useI18n();
  const add = () => {
    const gaps = slots.map((slot, index) => ({
      index,
      length: (slots[index + 1]?.start ?? 1440) - slot.start,
    }));
    const largest = gaps.reduce((a, b) => (b.length > a.length ? b : a));
    if (largest.length < 2) return;
    const next = [...slots];
    next.splice(largest.index + 1, 0, {
      start: slots[largest.index].start + Math.floor(largest.length / 2),
      themeId: slots[largest.index].themeId,
    });
    onChange(next);
  };
  return (
    <div className="space-y-5">
      <ThemeTimeline slots={slots} options={options} />
      <div className="space-y-2">
        {slots.map((slot, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
          >
            <span aria-hidden className="w-5 text-xs text-content-subtle tabular-nums">
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <div>
              <input
                type="time"
                step={60}
                required
                disabled={index === 0}
                aria-label={t("appearance.rotation.start")}
                value={formatThemeTime(slot.start)}
                onChange={(event) => {
                  if (!event.target.value) return;
                  const [hour, minute] = event.target.value.split(":").map(Number);
                  onChange(
                    slots.map((item, position) =>
                      position === index ? { ...item, start: hour * 60 + minute } : item,
                    ),
                  );
                }}
                className="rounded border border-input bg-transparent px-2 py-1 text-sm text-foreground disabled:opacity-60"
              />
              <div className="mt-1 text-[10px] text-muted-foreground">
                {t("appearance.rotation.end", {
                  time: formatThemeTime(slots[index + 1]?.start ?? 1440),
                })}
              </div>
            </div>
            <select
              aria-label={t("appearance.rotation.theme")}
              value={slot.themeId}
              onChange={(event) =>
                onChange(
                  slots.map((item, position) =>
                    position === index
                      ? {
                          ...item,
                          themeId:
                            options.find((option) => option.id === event.target.value)?.id ??
                            "silver",
                        }
                      : item,
                  ),
                )
              }
              className="min-w-28 flex-1 rounded border border-input bg-transparent px-3 py-2 text-sm text-foreground"
            >
              {options.map((option) => (
                <option key={option.id} value={option.id} className="bg-popover">
                  {option.name}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="icon"
              disabled={index === 0}
              aria-label={t("appearance.rotation.remove")}
              onClick={() => onChange(slots.filter((_, position) => position !== index))}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={add} disabled={slots.length >= 24}>
        <Plus className="size-4" />
        {t("appearance.rotation.add")}
      </Button>
    </div>
  );
}
