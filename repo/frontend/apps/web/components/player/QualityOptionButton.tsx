"use client";

import { Check } from "lucide-react";
import { MediaInfoBadge } from "@/components/shared/MediaInfoBadge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { QualityOptionButtonProps } from "@/types/playerBar";

export function QualityOptionButton({
  option,
  selected,
  disabled,
  onSelect,
}: QualityOptionButtonProps) {
  const { t } = useI18n();
  const Icon = option.icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(option.value)}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-wait disabled:opacity-60",
        option.isHero && "flex-col items-start p-3.5",
        selected ? "border-primary/50 bg-primary/10" : "border-border bg-muted/30 hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted",
          selected && "bg-primary/15 text-primary",
        )}
      >
        {option.shortLabel ? (
          <span className="text-xs font-bold">{option.shortLabel}</span>
        ) : (
          Icon && <Icon className="size-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 pr-5 text-sm font-semibold">
          {t(option.labelKey)}
          {option.badgeType && (
            <MediaInfoBadge tone={option.badgeType === "svip" ? "gold" : "red"}>
              {option.badgeType.toUpperCase()}
            </MediaInfoBadge>
          )}
        </span>
        {option.techSpec && (
          <span className="mt-1 block text-xs text-content-muted">{t(option.techSpec)}</span>
        )}
      </span>
      {selected && <Check className="absolute top-3 right-3 size-4 text-primary" />}
    </button>
  );
}
