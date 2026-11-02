"use client";

import { useMemo, type CSSProperties } from "react";
import { splitLyricGraphemes } from "@/components/lyrics/folia/src/utils/lyrics/graphemeTiming";
import type { SubtitleFillTextProps } from "@/types/lyrics/subtitlePreview";

/** Reveals the sung colour left to right with a soft edge: --fill is 0..1, --feather the edge width. */
const SUNG_MASK =
  "linear-gradient(to right, #000 calc(var(--fill) * (100% + var(--feather)) - var(--feather)), transparent calc(var(--fill) * (100% + var(--feather))))";

export function SubtitleFillText({ text, settings, progress }: SubtitleFillTextProps) {
  const characters = useMemo(() => splitLyricGraphemes(text), [text]);
  return (
    <span aria-label={text}>
      {characters.map((character, index) => (
        <span
          aria-hidden="true"
          key={index}
          className="relative inline-block whitespace-pre"
          style={
            {
              color: settings.unsungColor,
              "--fill":
                progress?.[index] ??
                `clamp(0, calc(var(--subtitle-progress, 0) * ${characters.length} - ${index}), 1)`,
              "--feather": `${settings.fillSoftness}%`,
            } as CSSProperties
          }
        >
          {character}
          <span
            className="absolute inset-0"
            style={{
              maskImage: SUNG_MASK,
              WebkitMaskImage: SUNG_MASK,
              ...(settings.colorMode === "gradient"
                ? {
                    backgroundImage: `linear-gradient(${settings.gradientAngle}deg, ${settings.color}, ${settings.gradientColor})`,
                    backgroundSize: `${characters.length * 100}% 100%`,
                    backgroundPosition: `${(index / Math.max(1, characters.length - 1)) * 100}% 0`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }
                : { color: settings.color }),
            }}
          >
            {character}
          </span>
        </span>
      ))}
    </span>
  );
}
