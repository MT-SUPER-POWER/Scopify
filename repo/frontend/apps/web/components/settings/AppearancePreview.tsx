"use client";

import { usePreviewScale } from "@/hooks/settings/usePreviewScale";
import { useI18n } from "@/store/module/i18n";
import type { AppearancePreviewProps } from "@/types/appearance";

const PREVIEW_WIDTH = 1100;
const PREVIEW_HEIGHT = 800;

/** The caller supplies the same content component used by the actual route. */
export function AppearancePreview({ children }: AppearancePreviewProps) {
  const { t } = useI18n();
  const { containerRef, scale } = usePreviewScale(PREVIEW_WIDTH);
  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={t("appearance.preview.label")}
      className="relative w-full overflow-hidden rounded-lg border border-border bg-surface-raised"
      style={{ aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}` }}
    >
      <div
        inert
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 origin-top-left overflow-hidden select-none"
        style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
