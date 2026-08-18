"use client";

import { CircleAlert, LayoutGrid, Monitor, RotateCw, Sparkles, Type } from "lucide-react";
import type { ReactNode } from "react";

import type { DesktopPlaybackWallpaperStatus } from "@scopify/desktop-contract";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { DesktopPlaybackWallpaperControlsProps } from "@/types/components/desktopPlaybackWallpaper";
import type { TranslateFn } from "@/types/i18n.generated";

function getStatusPresentation(status: DesktopPlaybackWallpaperStatus, t: TranslateFn) {
  switch (status.state) {
    case "running":
      return {
        className: "bg-emerald-500",
        label: t("desktopPlaybackController.statusRunning"),
      };
    case "starting":
      return {
        className: "bg-amber-400 animate-pulse",
        label: t("desktopPlaybackController.statusStarting"),
      };
    case "recovering":
      return {
        className: "bg-amber-400 animate-pulse",
        label: t("desktopPlaybackController.statusRecovering"),
      };
    case "policy-paused":
    case "policy-stopped":
      return {
        className: "bg-amber-400",
        label: t("desktopPlaybackController.statusPaused"),
      };
    case "faulted":
      return {
        className: "bg-red-500",
        label: t("desktopPlaybackController.statusFaulted"),
      };
    case "unsupported":
      return {
        className: "bg-content-muted/50",
        label: t("desktopPlaybackController.statusUnsupported"),
      };
    default:
      return {
        className: "bg-content-muted/50",
        label: t("desktopPlaybackController.statusInactive"),
      };
  }
}

export function DesktopPlaybackWallpaperControls({
  desktopIconVisibility,
  isDesktopIconPending,
  isPending,
  model,
  onConfigure,
  onDesktopIconVisibilityChange,
  onRetry,
}: DesktopPlaybackWallpaperControlsProps) {
  const { t } = useI18n();
  const preferences = model?.preferences;
  const status = model?.status ?? ({ reason: "disabled", state: "inactive" } as const);
  const statusPresentation = getStatusPresentation(status, t);
  const canRetry = status.state === "faulted" && status.retryable;

  return (
    <section className="desktop-controller-scroll h-full space-y-3 overflow-y-auto px-4 pt-3 pb-4">
      <div className="desktop-controller-card rounded-2xl px-3 py-2">
        <div className="px-1 pb-1 text-[10px] font-semibold tracking-[0.12em] text-content-muted uppercase">
          {t("desktopPlaybackController.desktopDisplay")}
        </div>
        <div className="flex h-10 items-center justify-between gap-4 px-1">
          <div className="flex min-w-0 items-center gap-3">
            <Monitor className="size-4 shrink-0 text-content-muted" />
            <span className="truncate text-sm font-medium text-content">
              {t("desktopPlaybackController.wallpaper")}
            </span>
          </div>
          <Switch
            aria-label={t("desktopPlaybackController.wallpaper")}
            checked={preferences?.enabled ?? false}
            disabled={!model || isPending}
            onCheckedChange={(enabled) =>
              void onConfigure({
                enabled,
                ...(enabled &&
                preferences &&
                !preferences.layers.background &&
                !preferences.layers.lyrics
                  ? { layers: { background: true } }
                  : {}),
              })
            }
          />
        </div>
        <ControlRow
          checked={desktopIconVisibility?.visible ?? false}
          disabled={
            isDesktopIconPending ||
            !desktopIconVisibility?.supported ||
            desktopIconVisibility.visible === null
          }
          icon={<LayoutGrid className="size-4" />}
          label={t("desktopPlaybackController.showDesktopIcons")}
          onCheckedChange={(visible) => void onDesktopIconVisibilityChange(visible)}
        />
        {desktopIconVisibility && !desktopIconVisibility.supported ? (
          <p className="px-8 pb-2 text-[11px] leading-4 text-content-muted">
            {t("desktopPlaybackController.desktopIconsUnavailable")}
          </p>
        ) : null}
      </div>

      <div className="desktop-controller-card rounded-2xl px-3 py-2">
        <div className="px-1 pb-1 text-[10px] font-semibold tracking-[0.12em] text-content-muted uppercase">
          {t("desktopPlaybackController.layers")}
        </div>
        <ControlRow
          checked={preferences?.layers.background ?? false}
          disabled={!model || isPending}
          icon={<Sparkles className="size-4" />}
          label={t("desktopPlaybackController.background")}
          onCheckedChange={(background) => void onConfigure({ layers: { background } })}
        />
        <ControlRow
          checked={preferences?.layers.lyrics ?? false}
          disabled={!model || isPending}
          icon={<Type className="size-4" />}
          label={t("desktopPlaybackController.lyrics")}
          onCheckedChange={(lyrics) => void onConfigure({ layers: { lyrics } })}
        />
      </div>

      <div className="desktop-controller-card rounded-2xl px-3 py-2">
        <div className="px-1 pb-1 text-[10px] font-semibold tracking-[0.12em] text-content-muted uppercase">
          {t("desktopPlaybackController.compatibility")}
        </div>
        <ControlRow
          checked={preferences?.systemWallpaperFallback ?? false}
          disabled={!model || isPending || !preferences?.layers.background}
          icon={<CircleAlert className="size-4" />}
          label={t("desktopPlaybackController.systemFallback")}
          onCheckedChange={(systemWallpaperFallback) =>
            void onConfigure({ systemWallpaperFallback })
          }
        />
      </div>

      <div className="desktop-controller-card flex items-start justify-between gap-3 rounded-2xl px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-content-muted">
            <span className={cn("size-2 shrink-0 rounded-full", statusPresentation.className)} />
            <span>{statusPresentation.label}</span>
          </div>
          {"diagnostic" in status ? (
            <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-content-muted">
              {status.diagnostic}
            </p>
          ) : null}
        </div>
        {canRetry ? (
          <button
            type="button"
            className="desktop-controller-soft-button flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs transition"
            disabled={isPending}
            onClick={() => void onRetry()}
          >
            <RotateCw className={cn("size-3.5", isPending && "animate-spin")} />
            {t("desktopPlaybackController.retry")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

interface ControlRowProps {
  checked: boolean;
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onCheckedChange(checked: boolean): void;
}

function ControlRow({ checked, disabled, icon, label, onCheckedChange }: ControlRowProps) {
  return (
    <label className="desktop-controller-row flex h-10 cursor-pointer items-center gap-3 rounded-xl px-1 transition has-disabled:cursor-default has-disabled:opacity-45">
      <span className="text-content-muted">{icon}</span>
      <span className="flex-1 text-sm text-content">{label}</span>
      <Switch
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </label>
  );
}
