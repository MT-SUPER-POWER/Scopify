"use client";

import { MonitorOff, MonitorUp } from "lucide-react";

import type { DesktopPlaybackWallpaperModel } from "@scopify/desktop-contract";

import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

interface DesktopPlaybackControllerQuickToggleProps {
  isPending: boolean;
  model: DesktopPlaybackWallpaperModel | null;
  onEnabledChange(enabled: boolean): void;
}

export function DesktopPlaybackControllerQuickToggle({
  isPending,
  model,
  onEnabledChange,
}: DesktopPlaybackControllerQuickToggleProps) {
  const { t } = useI18n();
  const status = model?.status;
  const enabled = model?.preferences.enabled ?? false;

  return (
    <button
      type="button"
      aria-label={t("desktopPlaybackController.wallpaper")}
      aria-pressed={enabled}
      className="desktop-controller-soft-button relative flex size-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35"
      data-active={enabled}
      disabled={!model || isPending}
      title={t("desktopPlaybackController.wallpaper")}
      onClick={() => onEnabledChange(!enabled)}
    >
      {enabled ? <MonitorUp className="size-4" /> : <MonitorOff className="size-4" />}
      <span
        aria-hidden
        className={cn(
          "absolute top-0 right-0 size-2 rounded-full ring-2 ring-[var(--desktop-controller-background)]",
          status?.state === "running" && "bg-emerald-500",
          (status?.state === "starting" || status?.state === "recovering") &&
            "animate-pulse bg-amber-400",
          status?.state === "faulted" && "bg-red-500",
          (status?.state === "policy-paused" || status?.state === "policy-stopped") &&
            "bg-amber-400",
          (!status || status.state === "inactive" || status.state === "unsupported") &&
            "bg-content-muted/45",
        )}
      />
    </button>
  );
}
