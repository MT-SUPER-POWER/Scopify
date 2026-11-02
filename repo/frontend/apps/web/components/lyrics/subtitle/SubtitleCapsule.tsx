"use client";

import { useCallback } from "react";
import { useSubtitleMarquee } from "@/hooks/lyrics/useSubtitleMarquee";
import { useSubtitleFill } from "@/hooks/settings/useSubtitleFill";
import { cn } from "@/lib/utils";
import { SubtitleFillText } from "./SubtitleFillText";
import { CompanionSubtitleFillText } from "@/components/lyrics/companion/CompanionSubtitleFillText";
import { LYRICS_PREVIEW_FONTS } from "@/constants/appearance";
import { useSubtitleEntrance } from "@/hooks/settings/useSubtitleEntrance";
import type { SubtitleCapsuleProps } from "@/types/lyrics/subtitlePreview";

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
  fillLine,
  singleLine = false,
  lineDurationMs = 0,
}: SubtitleCapsuleProps) {
  const fillRef = useSubtitleFill(
    playback,
    settings.fillDuration,
    loop,
    settings.fillEnabled && !fillProgress && !fillLine,
  );
  const entrance = useSubtitleEntrance(settings, payload.source, playback, loop);
  const marquee = useSubtitleMarquee(playback, lineDurationMs, singleLine);
  const { viewportRef } = marquee;
  const sourceRef = useCallback(
    (node: HTMLDivElement | null) => {
      fillRef.current = node;
      viewportRef.current = node;
    },
    [fillRef, viewportRef],
  );
  const translation =
    settings.showTranslation &&
    !(settings.autoCollapseChinese && payload.isChinese) &&
    payload.target;
  const sourceContent = (
    <>
      {settings.fillEnabled ? (
        fillLine ? (
          <CompanionSubtitleFillText line={fillLine} text={payload.source} settings={settings} />
        ) : (
          <SubtitleFillText text={payload.source} settings={settings} progress={fillProgress} />
        )
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
          className="ml-1.5 inline-block h-[0.9em] w-[3px] animate-pulse rounded-xs align-middle [animation-duration:900ms] motion-reduce:animate-none"
          style={{ backgroundColor: settings.color }}
        />
      )}
    </>
  );
  const alpha = Math.round((settings.backdropOpacity / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  return (
    <div
      ref={entrance.ref}
      className="box-border w-fit min-w-0 shrink border border-white/10 transition-[background-color,border-radius] duration-200 ease-out motion-reduce:transition-none"
      style={{
        maxWidth: singleLine ? "100%" : settings.maxWidth,
        padding: `${settings.paddingY}px ${settings.paddingX}px`,
        borderRadius: settings.radius,
        backgroundColor: `${settings.backgroundColor}${alpha}`,
        backdropFilter: `blur(${settings.blur}px)`,
        fontFamily: LYRICS_PREVIEW_FONTS[settings.font],
        textAlign: settings.textAlign,
      }}
    >
      <div
        ref={sourceRef}
        className={cn(
          "leading-normal tracking-wide wrap-anywhere whitespace-pre-wrap",
          // Single-line mode: overflow is scrolled horizontally by useSubtitleMarquee.
          singleLine &&
            "flex overflow-hidden whitespace-nowrap data-[align=center]:justify-center-safe data-[align=left]:justify-start data-[align=right]:justify-end-safe",
        )}
        data-align={settings.textAlign}
        style={{
          fontSize: settings.fontSize,
          fontWeight: settings.fontWeight,
          filter: settings.textShadow ? "drop-shadow(0 1px 2px rgb(0 0 0 / 90%))" : undefined,
        }}
      >
        {singleLine ? (
          <span ref={marquee.contentRef} className="inline-block shrink-0 will-change-transform">
            {sourceContent}
          </span>
        ) : (
          sourceContent
        )}
      </div>
      {translation && (
        <div
          className={cn(
            "leading-1.4 mt-1 wrap-anywhere whitespace-pre-wrap",
            singleLine && "truncate",
          )}
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
