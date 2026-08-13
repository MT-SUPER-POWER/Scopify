"use client";

import { Maximize2, Minimize2, X } from "lucide-react";

import type { DesktopPlaybackControllerLayout } from "@mt-super-power/desktop-contract";

import { useI18n } from "@/store/module/i18n";

interface DesktopPlaybackControllerHeaderProps {
  isLayoutPending: boolean;
  layout: DesktopPlaybackControllerLayout;
  onClose(): void;
  onLayoutChange(): void;
}

export function DesktopPlaybackControllerHeader({
  isLayoutPending,
  layout,
  onClose,
  onLayoutChange,
}: DesktopPlaybackControllerHeaderProps) {
  const { t } = useI18n();
  const isExpanded = layout === "expanded";
  const layoutLabel = t(
    isExpanded
      ? "desktopPlaybackController.collapseWindow"
      : "desktopPlaybackController.expandWindow",
  );

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 h-11 [-webkit-app-region:drag]">
      <div className="pointer-events-auto absolute top-2.5 right-2.5 flex items-center gap-1 [-webkit-app-region:no-drag]">
        <button
          type="button"
          aria-label={layoutLabel}
          title={layoutLabel}
          className="desktop-controller-window-button flex size-6 items-center justify-center rounded-full transition disabled:opacity-30"
          disabled={isLayoutPending}
          onClick={onLayoutChange}
        >
          {isExpanded ? (
            <Minimize2 className="size-[13px]" />
          ) : (
            <Maximize2 className="size-[13px]" />
          )}
        </button>
        <button
          type="button"
          aria-label={t("ui.close")}
          title={t("ui.close")}
          className="desktop-controller-window-button flex size-6 items-center justify-center rounded-full transition"
          onClick={onClose}
        >
          <X className="size-[13px]" />
        </button>
      </div>
    </header>
  );
}
