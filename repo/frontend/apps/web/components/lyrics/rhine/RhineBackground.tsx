"use client";

import { DEFAULT_RHINE_BACKGROUND_TUNING } from "@/constants/rhineBackground";
import { useRhineBackground } from "@/hooks/lyrics/useRhineBackground";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";

import type { RhineBackgroundProps } from "@/types/lyrics/rhine/background";

/** Paper fade that keeps the lyric column readable over the canvas; `--rhine-paper` is an RGB triple. */
const READING_SPACE = {
  landscape: [
    "linear-gradient(90deg, rgb(var(--rhine-paper) / 98%), rgb(var(--rhine-paper) / 92%) 24%, rgb(var(--rhine-paper) / 64%) 42%, rgb(var(--rhine-paper) / 0%) 65%)",
    "linear-gradient(180deg, rgb(var(--rhine-paper) / 80%), rgb(var(--rhine-paper) / 0%) 24%, rgb(var(--rhine-paper) / 0%) 78%, rgb(var(--rhine-paper) / 45%))",
  ].join(", "),
  portrait:
    "linear-gradient(180deg, rgb(var(--rhine-paper) / 97%), rgb(var(--rhine-paper) / 92%) 25%, rgb(var(--rhine-paper) / 55%) 52%, rgb(var(--rhine-paper) / 8%) 80%)",
};

const LIGHT_SHEEN =
  "linear-gradient(116deg, transparent 42%, rgb(255 248 222 / 12%) 55%, transparent 70%)";

export default function RhineBackground(props: RhineBackgroundProps) {
  const { canvasRef, status, attempt, retry } = useRhineBackground(props);
  const { t } = useTranslation();
  const tuning = { ...DEFAULT_RHINE_BACKGROUND_TUNING, ...props.config?.rhine?.tuning };
  const dark = tuning.colorMode === "auto" ? !props.isDaylight : tuning.colorMode === "dark";
  const background = dark ? "#11181b" : "#eae5e1";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={
        {
          backgroundColor: background,
          "--rhine-paper": dark ? "17 24 27" : "234 229 225",
          "--rhine-reading": READING_SPACE.landscape,
          "--rhine-reading-portrait": READING_SPACE.portrait,
        } as CSSProperties
      }
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
        style={{ backgroundColor: props.theme.backgroundColor, opacity: tuning.overlayOpacity }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundImage: LIGHT_SHEEN }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-(image:--rhine-reading) portrait:bg-(image:--rhine-reading-portrait)"
      />
      {status === "error" ? (
        <div
          role="status"
          className="pointer-events-auto absolute bottom-6 left-6 flex items-center gap-3 rounded-xl px-4 py-3 text-xs"
          style={{ backgroundColor: background, color: dark ? "#ece8df" : "#242a28" }}
        >
          <span>{t("folia.rhine.loadError")}</span>
          <button
            type="button"
            onClick={retry}
            className="rounded px-2 py-1 underline focus-visible:outline-2"
          >
            {t("folia.rhine.retry")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
