"use client";

import { useSubtitleFill } from "@/hooks/settings/useSubtitleFill";
import { SubtitleFillText } from "./SubtitleFillText";
import { LYRICS_PREVIEW_FONTS } from "@/constants/appearance";
import { useSubtitleEntrance } from "@/hooks/settings/useSubtitleEntrance";
import type { SubtitleCapsuleProps } from "@/types/subtitle-preview";
import styles from "./subtitle-capsule.module.css";

// Adapted from subtitle-app's SubtitleOverlay.vue. No store or host IPC dependency.
export function SubtitleCapsule(props: SubtitleCapsuleProps) {
  const { settings, payload, replayId } = props;
  const key = JSON.stringify([
    replayId,
    payload,
    settings.entrance,
    settings.animationDuration,
    settings.characterInterval,
  ]);
  return <SubtitleCapsuleLine key={key} {...props} />;
}

function SubtitleCapsuleLine({
  settings,
  payload,
  playback,
  loop,
  fillProgress,
}: SubtitleCapsuleProps) {
  const fillRef = useSubtitleFill(
    playback,
    settings.fillDuration,
    loop,
    settings.fillEnabled && !fillProgress,
  );
  const entrance = useSubtitleEntrance(settings, payload.source, playback, loop);
  const translation =
    settings.showTranslation &&
    !(settings.autoCollapseChinese && payload.isChinese) &&
    payload.target;
  const alpha = Math.round((settings.backdropOpacity / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  return (
    <div
      ref={entrance.ref}
      className={styles.capsule}
      style={{
        maxWidth: settings.maxWidth,
        padding: `${settings.paddingY}px ${settings.paddingX}px`,
        borderRadius: settings.radius,
        backgroundColor: `${settings.backgroundColor}${alpha}`,
        backdropFilter: `blur(${settings.blur}px)`,
        fontFamily: LYRICS_PREVIEW_FONTS[settings.font],
        textAlign: settings.textAlign,
      }}
    >
      <div
        ref={fillRef}
        className={styles.source}
        style={{
          fontSize: settings.fontSize,
          fontWeight: settings.fontWeight,
          filter: settings.textShadow ? "drop-shadow(0 1px 2px rgb(0 0 0 / 90%))" : undefined,
        }}
      >
        {settings.fillEnabled ? (
          <SubtitleFillText text={payload.source} settings={settings} progress={fillProgress} />
        ) : (
          <span
            style={
              settings.colorMode === "gradient"
                ? {
                    backgroundImage: `linear-gradient(${settings.gradientAngle}deg, ${settings.color}, ${settings.gradientColor})`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }
                : { color: settings.color }
            }
          >
            {entrance.text || "\u200b"}
          </span>
        )}
        {!settings.fillEnabled && entrance.streaming && (
          <span
            aria-hidden="true"
            className={styles.cursor}
            style={{ backgroundColor: settings.color }}
          />
        )}
      </div>
      {translation && (
        <div
          className={styles.translation}
          style={{
            fontSize: settings.secondarySize,
            color: settings.secondaryColor,
            textShadow: settings.textShadow ? "0 1px 3px rgb(0 0 0 / 90%)" : undefined,
          }}
        >
          {translation}
        </div>
      )}
    </div>
  );
}
