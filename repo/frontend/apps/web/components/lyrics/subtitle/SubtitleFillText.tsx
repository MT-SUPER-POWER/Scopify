import type { CSSProperties } from "react";
import type { SubtitleFillTextProps } from "@/types/subtitle-preview";
import styles from "./subtitle-capsule.module.css";

export function SubtitleFillText({ text, settings, progress }: SubtitleFillTextProps) {
  const characters = Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    (part) => part.segment,
  );
  return (
    <span aria-label={text}>
      {characters.map((character, index) => (
        <span
          aria-hidden="true"
          key={index}
          className={styles.glyph}
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
            className={styles.sung}
            style={
              settings.colorMode === "gradient"
                ? {
                    backgroundImage: `linear-gradient(${settings.gradientAngle}deg, ${settings.color}, ${settings.gradientColor})`,
                    backgroundSize: `${characters.length * 100}% 100%`,
                    backgroundPosition: `${(index / Math.max(1, characters.length - 1)) * 100}% 0`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }
                : { color: settings.color }
            }
          >
            {character}
          </span>
        </span>
      ))}
    </span>
  );
}
