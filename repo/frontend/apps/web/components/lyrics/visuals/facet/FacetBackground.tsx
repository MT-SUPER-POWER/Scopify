"use client";

import { DEFAULT_FACET_BACKGROUND_TUNING } from "@/constants/facetBackground";
import { useFacetBackground } from "@/hooks/lyrics/useFacetBackground";
import { useTranslation } from "react-i18next";

import type { FacetBackgroundProps } from "@/types/lyrics/facet/background";

export default function FacetBackground(props: FacetBackgroundProps) {
  const { canvasRef, status, attempt, retry } = useFacetBackground(props);
  const { t } = useTranslation();
  const { theme } = props;
  const tuning = { ...DEFAULT_FACET_BACKGROUND_TUNING, ...props.config?.facet?.tuning };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <canvas
        key={attempt}
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 size-full"
        style={{ visibility: status === "ready" ? "visible" : "hidden" }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: theme.backgroundColor, opacity: tuning.overlayOpacity }}
      />
      {status === "error" ? (
        <div
          role="status"
          className="pointer-events-auto absolute bottom-6 left-6 flex items-center gap-3 rounded-xl px-4 py-3 text-xs"
          style={{ backgroundColor: theme.backgroundColor, color: theme.primaryColor }}
        >
          <span>{t("folia.facet.loadError")}</span>
          <button
            type="button"
            onClick={retry}
            className="rounded px-2 py-1 underline focus-visible:outline-2"
          >
            {t("folia.facet.retry")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
