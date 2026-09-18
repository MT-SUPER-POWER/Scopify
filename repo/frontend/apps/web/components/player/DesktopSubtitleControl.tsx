"use client";

import { Captions } from "lucide-react";
import Link from "next/link";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Switch } from "@scopify/ui/shadcn/components/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@scopify/ui/shadcn/components/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@scopify/ui/shadcn/components/tooltip";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { useDesktopSubtitleControlSync } from "@/hooks/player/useDesktopSubtitleControlSync";
import { runtime } from "@/lib/runtime";
import { useAppearanceStore } from "@/store/module/appearance";
import { useDesktopSubtitleControl } from "@/store/module/desktopSubtitleControl";
import { useI18n } from "@/store/module/i18n";

export function DesktopSubtitleControl() {
  const { t } = useI18n();
  const control = useDesktopSubtitleControl();
  const showTranslation = useAppearanceStore((state) => state.lyricsPreview.showTranslation);
  const updateLyricsPreview = useAppearanceStore((state) => state.updateLyricsPreview);
  useDesktopSubtitleControlSync();
  if (!runtime.isDesktop) return null;
  return (
    <Popover open={control.open} onOpenChange={control.setOpen}>
      <TooltipProvider>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("subtitleControl.title")}
                className={`flex items-center justify-center transition-colors ${control.preferences?.enabled || control.open ? "text-brand" : "text-content-muted hover:text-content"}`}
              >
                <Captions className="size-5 stroke-[1.65px] lg:size-6" />
              </button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="top">
            <ShortcutHint commandId="toggle-subtitle-controls" label={t("subtitleControl.title")} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent side="top" align="end" sideOffset={12} className="z-2000 w-80 space-y-4">
        <h3 className="text-base font-semibold">{t("subtitleControl.title")}</h3>
        <div className="flex items-center justify-between gap-3">
          <ShortcutHint commandId="toggle-desktop-subtitle" label={t("subtitleControl.enabled")} />
          <Switch
            aria-label={t("subtitleControl.enabled")}
            checked={Boolean(control.preferences?.enabled)}
            disabled={control.busy || !control.preferences}
            onCheckedChange={() => void control.toggle()}
          />
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>{t("subtitlePreview.translation")}</span>
          <Switch
            checked={showTranslation}
            onCheckedChange={(value) => updateLyricsPreview({ showTranslation: value })}
          />
        </label>
        {(["alwaysOnTop", "clickThrough"] as const).map((key) => (
          <label key={key} className="flex items-center justify-between gap-3 text-sm">
            <span>
              {t(key === "alwaysOnTop" ? "desktopLyrics.keepOnTop" : "desktopLyrics.clickThrough")}
            </span>
            <Switch
              checked={Boolean(control.preferences?.[key])}
              disabled={control.busy || !control.preferences}
              onCheckedChange={(value) => void control.configure({ [key]: value })}
            />
          </label>
        ))}
        {control.failed && (
          <div role="alert" className="space-y-2 text-sm text-danger">
            <p>{t("subtitleControl.failed")}</p>
            <Button size="sm" variant="outline" onClick={() => void control.refresh()}>
              {t("subtitleControl.retry")}
            </Button>
          </div>
        )}
        <div className="border-t border-border pt-3">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link
              href="/setting?tab=appearance#subtitle-style"
              onClick={() => control.setOpen(false)}
            >
              {t("subtitleControl.style")}
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
