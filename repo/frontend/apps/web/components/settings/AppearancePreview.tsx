"use client";

import { BackgroundPreviewContext } from "@/lib/settings/backgroundPreviewContext";
import { usePreviewScale } from "@/hooks/settings/usePreviewScale";
import { useTranslation } from "react-i18next";

import type { AppearancePreviewProps } from "@/types/appearance/model";

const PREVIEW_WIDTH = 1100;
const PREVIEW_HEIGHT = 800;

/** The caller supplies the same content component used by the actual route. */
export function AppearancePreview({ children, background, variant }: AppearancePreviewProps) {
  const { t } = useTranslation();
  const { containerRef, scale } = usePreviewScale(PREVIEW_WIDTH);
  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={t("appearance.preview.label")}
      data-theme={variant ? "scopify-default" : undefined}
      className={`relative w-full overflow-hidden rounded-lg border border-border bg-surface-raised text-content ${variant ?? ""}`}
      style={{ aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}` }}
    >
      <div
        inert
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 origin-top-left overflow-hidden select-none"
        style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, transform: `scale(${scale})` }}
      >
        <BackgroundPreviewContext value={background ?? null}>{children}</BackgroundPreviewContext>
      </div>
    </div>
  );
}
