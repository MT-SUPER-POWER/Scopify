"use client";

import { motion, useTransform } from "framer-motion";
import VisualizerShell from "@/components/lyrics/folia/src/components/visualizer/VisualizerShell";
import type { VisualizerSharedProps } from "@/components/lyrics/folia/src/components/visualizer/definition";
import {
  resolveThemeFontStack,
  resolveThemeTranslationFontStack,
  resolveThemeFontWeight,
} from "@/components/lyrics/folia/src/utils/fontStacks";
import {
  resolveLyricAlternateText,
  resolveSubtitleContentMode,
} from "@/components/lyrics/folia/src/utils/lyrics/alternateText";
import { useArchiveLyricMotion } from "@/hooks/lyrics/useArchiveLyricMotion";
import { formatArchiveTime } from "@/lib/lyrics/rhine/archiveLyrics";
import { useTranslation } from "react-i18next";

import type { ArchiveVisualizerStyle } from "@/types/lyrics/archive";
import { ArchiveLyricLine } from "./ArchiveLyricLine";

/** Archive palette; `ArchiveLyricLine` paints its word fill with `--archive-ink` / `--archive-unsung`. */
const ARCHIVE_PALETTE: Record<"light" | "dark", Record<`--archive-${string}`, string>> = {
  light: {
    "--archive-ink": "#252c29",
    "--archive-muted": "#72776b",
    "--archive-unsung": "#92968a",
    "--archive-line": "rgb(49 59 47 / 23%)",
    "--archive-accent": "#9a7345",
    "--archive-paper": "#e9e8df",
  },
  dark: {
    "--archive-ink": "#edece0",
    "--archive-muted": "#a6b0a8",
    "--archive-unsung": "#818c88",
    "--archive-line": "rgb(198 213 199 / 25%)",
    "--archive-accent": "#d2ad70",
    "--archive-paper": "#11181b",
  },
};

/*
 * Layout breakpoints are container queries on the stage (`@container-size`):
 * - narrow: `[@container(max-width:640px)]:`
 * - short:  `[@container(max-height:520px)_and_(min-width:641px)]:`
 */
const monoClass = "font-[family-name:Consolas,monospace]";
const labelClass = `block text-(--archive-muted) ${monoClass} text-[10px] leading-[1.5] tracking-[0.12em]`;
const seekButtonClass = "hover:text-(--archive-ink)";
const nextRowClass =
  "flex max-h-[3.2em] items-baseline gap-3 overflow-hidden text-left leading-[1.6]";
const nextArrowClass = `${nextRowClass} text-(--archive-accent)`;
const registrationMarkClass =
  "absolute size-2 before:absolute before:top-[3px] before:left-0 before:h-px before:w-2 before:bg-current after:absolute after:top-0 after:left-[3px] after:h-2 after:w-px after:bg-current";

export default function VisualizerArchive(props: VisualizerSharedProps) {
  const { t } = useTranslation();
  const {
    lines,
    currentLineIndex,
    currentTime,
    theme,
    seed,
    paused = false,
    staticMode = false,
    showText = true,
    songTitle,
    songArtist,
    songAlbum,
    onLyricLineSeek,
  } = props;
  const active = lines[currentLineIndex];
  const previous = currentLineIndex > 0 ? lines[currentLineIndex - 1] : undefined;
  const next = active
    ? lines[currentLineIndex + 1]
    : lines.find((line) => line.startTime > currentTime.get());
  const identity = `${seed ?? "archive"}:${active?.id ?? currentLineIndex}:${active?.startTime ?? "rest"}`;
  const { viewportRef, clipPath, y, opacity, reducedMotion } = useArchiveLyricMotion({
    identity,
    paused,
    staticMode,
  });
  const recordMotion = useArchiveLyricMotion({
    identity: String(seed ?? "archive"),
    paused,
    staticMode,
  });
  const timeLabel = useTransform(currentTime, formatArchiveTime);
  const lineProgress = useTransform(currentTime, (time) =>
    active
      ? Math.max(
          0,
          Math.min(1, (time - active.startTime) / Math.max(0.1, active.endTime - active.startTime)),
        )
      : 0,
  );
  const colorMode =
    props.background?.mode === "rhine" ? props.background.rhine?.tuning?.colorMode : "auto";
  const dark = colorMode === "dark" || (colorMode !== "light" && !props.isDaylight);
  const subtitleMode = resolveSubtitleContentMode(
    props.subtitleContentMode,
    props.showSubtitleTranslation ?? true,
  );
  const subtitle =
    active && !props.hideTranslationSubtitle ? resolveLyricAlternateText(active, subtitleMode) : "";
  const style: ArchiveVisualizerStyle = {
    "--archive-font-scale": props.lyricsFontScale ?? 1,
    "--archive-subtitle-scale": props.subtitleFontScale ?? 1,
    ...ARCHIVE_PALETTE[dark ? "dark" : "light"],
    fontFamily: resolveThemeFontStack({ ...theme, fontStyle: "sans" }),
  };

  return (
    <VisualizerShell
      theme={theme}
      audioPower={props.audioPower}
      audioBands={props.audioBands}
      sharedProps={props}
    >
      {showText ? (
        <div
          className="group/archive @container-size pointer-events-none absolute inset-0 z-10 overflow-hidden text-(--archive-ink) [text-rendering:optimizeLegibility] [&_button]:pointer-events-auto [&_button]:cursor-pointer [&_button:disabled]:pointer-events-none [&_button:disabled]:cursor-default [&_button:focus-visible]:outline-1 [&_button:focus-visible]:outline-offset-5 [&_button:focus-visible]:outline-(--archive-accent)"
          style={style}
          data-paused={paused}
          data-static={reducedMotion}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-[4cqw] inset-y-[4cqh] text-(--archive-line)"
          >
            <span className={`${registrationMarkClass} top-0 left-0`} />
            <span className={`${registrationMarkClass} top-0 right-0`} />
            <span className={`${registrationMarkClass} bottom-0 left-0`} />
            <span className={`${registrationMarkClass} right-0 bottom-0`} />
          </div>
          <header className="absolute inset-x-[7cqw] top-[7cqh] flex items-end justify-between gap-5 border-b border-(--archive-line) pb-[18px] [@container(max-height:520px)_and_(min-width:641px)]:top-[6cqh] [@container(max-height:520px)_and_(min-width:641px)]:pb-[10px] [@container(max-width:640px)]:pb-3">
            <div className="flex flex-col gap-1.5">
              <strong className="leading-0.9 flex items-baseline gap-2.5 font-[family-name:Arial,sans-serif] text-[length:clamp(20px,2cqw,32px)] font-[750] tracking-[-0.06em]">
                SCOPIFY
                <span className="size-[7px] bg-(--archive-accent)" />
              </strong>
              <span className={`${monoClass} leading-1.2 text-[9px] tracking-[0.17em]`}>
                RHINE / SOUND ARCHIVE
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] tracking-widest text-(--archive-muted) [@container(max-width:640px)]:text-[9px]">
              <span className="size-[5px] bg-(--archive-accent) group-data-[paused=true]/archive:bg-transparent group-data-[paused=true]/archive:outline group-data-[paused=true]/archive:outline-(--archive-muted)" />
              <span>{t(paused ? "folia.archive.suspended" : "folia.archive.reading")}</span>
            </div>
          </header>

          <section className="absolute top-[25cqh] left-[7cqw] flex h-[54cqh] w-[49cqw] flex-col [@container(max-width:640px)]:top-[24cqh] [@container(max-width:640px)]:w-[84cqw]">
            <motion.div className="shrink-0" style={{ clipPath: recordMotion.clipPath }}>
              <span className={labelClass}>01 / {t("folia.archive.record")}</span>
              <h2
                className="leading-1.4 mt-[11px] mb-[5px] truncate text-[length:clamp(14px,1.5cqw,22px)] font-semibold [@container(max-height:520px)_and_(min-width:641px)]:mt-[5px]"
                title={songTitle ?? undefined}
              >
                {songTitle || t("folia.archive.untitled")}
              </h2>
              <p
                className="m-0 truncate text-[11px] leading-normal text-(--archive-muted)"
                title={[songArtist, songAlbum].filter(Boolean).join(" / ")}
              >
                {[songArtist, songAlbum].filter(Boolean).join(" / ") || "—"}
              </p>
            </motion.div>

            <div className="mt-[6cqh] flex min-h-0 flex-1 gap-5 [@container(max-height:520px)_and_(min-width:641px)]:mt-[4cqh] [@container(max-width:640px)]:mt-[5cqh] [@container(max-width:640px)]:gap-3">
              <div
                className={`flex flex-[0_0_26px] flex-col items-start gap-[13px] pt-[5px] ${monoClass} text-[10px] leading-none text-(--archive-accent)`}
                aria-hidden="true"
              >
                <span>{String(Math.max(0, currentLineIndex + 1)).padStart(3, "0")}</span>
                <span className="relative h-[clamp(70px,15cqh,170px)] w-px bg-(--archive-line)">
                  <motion.i
                    className="absolute inset-0 w-0.5 origin-top bg-(--archive-accent)"
                    style={{ scaleY: lineProgress }}
                  />
                </span>
              </div>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch">
                {/* Enter: opacity 0.9 → 0.63 and 5px rise; frozen while paused, dropped for reduced motion. */}
                <div
                  className="mb-[18px] h-6 shrink-0 animate-in text-[length:clamp(12px,1.2cqw,17px)] text-(--archive-muted) opacity-63 ease-[ease-out] animation-duration-650 fade-in-90 fill-mode-both slide-in-from-bottom-[5px] group-data-[paused=true]/archive:animation-paused group-data-[static=true]/archive:animate-none motion-reduce:animate-none [@container(max-height:520px)_and_(min-width:641px)]:hidden [@container(max-width:640px)]:mb-2.5"
                  key={`previous:${identity}`}
                >
                  {previous ? (
                    onLyricLineSeek ? (
                      <button
                        type="button"
                        className={`max-w-full truncate ${seekButtonClass}`}
                        onClick={() => onLyricLineSeek(previous.startTime)}
                        aria-label={`${t("folia.archive.seekLine")}: ${previous.fullText}`}
                      >
                        {previous.fullText}
                      </button>
                    ) : (
                      <span className="max-w-full truncate">{previous.fullText}</span>
                    )
                  ) : (
                    <span aria-hidden="true" className="max-w-full truncate">
                      —
                    </span>
                  )}
                </div>
                <motion.div
                  ref={viewportRef}
                  className="leading-1.46 pointer-events-auto max-h-[28cqh] min-h-[1.5em] [scrollbar-width:thin] overflow-y-auto overscroll-contain text-[length:clamp(calc(23px*var(--archive-font-scale)),calc(3.15cqw*var(--archive-font-scale)),calc(54px*var(--archive-font-scale)))] tracking-[-0.035em] wrap-anywhere data-[long=true]:text-[length:clamp(calc(19px*var(--archive-font-scale)),calc(2.35cqw*var(--archive-font-scale)),calc(38px*var(--archive-font-scale)))] [@container(max-height:520px)_and_(min-width:641px)]:text-[length:calc(5.5cqh*var(--archive-font-scale))] [@container(max-width:640px)]:text-[length:calc(6.5cqw*var(--archive-font-scale))] [@container(max-width:640px)]:data-[long=true]:text-[length:calc(5cqw*var(--archive-font-scale))]"
                  style={{ clipPath, y, opacity, fontWeight: resolveThemeFontWeight(theme, 600) }}
                  data-long={(active?.fullText.length ?? 0) > 48}
                >
                  {active ? (
                    <ArchiveLyricLine
                      line={active}
                      currentTime={currentTime}
                      onSeek={onLyricLineSeek}
                      seekLabel={t("folia.archive.seekLine")}
                    />
                  ) : (
                    <p className="m-0 font-[350] tracking-[0.07em] text-(--archive-muted)">
                      {lines.length
                        ? t("folia.archive.interlude")
                        : t("folia.archive.instrumental")}
                    </p>
                  )}
                </motion.div>
                <div
                  key={`subtitle:${identity}`}
                  className="leading-1.65 pointer-events-auto mt-[18px] max-h-[9cqh] min-h-[1.6em] shrink-0 [scrollbar-width:thin] overflow-y-auto text-[length:clamp(calc(12px*var(--archive-subtitle-scale)),calc(1.15cqw*var(--archive-subtitle-scale)),calc(19px*var(--archive-subtitle-scale)))] text-(--archive-muted) [@container(max-height:520px)_and_(min-width:641px)]:mt-2 [@container(max-width:640px)]:mt-3"
                  style={{
                    fontFamily: resolveThemeTranslationFontStack(props.subtitleTheme ?? theme),
                    opacity: props.subtitleOverlayOpacity ?? 1,
                  }}
                >
                  {subtitle || "\u00a0"}
                </div>
                <div className="mt-[22px] shrink-0 text-[length:clamp(11px,1cqw,15px)] text-(--archive-muted) opacity-80 [@container(max-height:520px)_and_(min-width:641px)]:hidden [@container(max-width:640px)]:mt-[15px]">
                  {next ? (
                    onLyricLineSeek ? (
                      <button
                        type="button"
                        className={`${nextRowClass} ${seekButtonClass}`}
                        onClick={() => onLyricLineSeek(next.startTime)}
                        aria-label={`${t("folia.archive.seekLine")}: ${next.fullText}`}
                      >
                        <span aria-hidden="true" className={nextArrowClass}>
                          ↳
                        </span>
                        {next.fullText}
                      </button>
                    ) : (
                      <span className={nextRowClass}>
                        <span aria-hidden="true" className={nextArrowClass}>
                          ↳
                        </span>
                        {next.fullText}
                      </span>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Reserve the player area in both states so revealing the controls never moves the archive. */}
          <footer className="absolute inset-x-[7cqw] bottom-[max(115px,14cqh)] flex items-center gap-6 border-t border-(--archive-line) pt-[15px] [@container(max-height:520px)_and_(min-width:641px)]:hidden [@container(max-width:640px)]:justify-between [@container(max-width:640px)]:gap-3">
            <span className={labelClass}>02 / {t("folia.archive.transcript")}</span>
            <div
              className={`flex items-center gap-3 text-(--archive-ink) ${monoClass} text-[11px] leading-none tabular-nums`}
            >
              <span
                aria-hidden="true"
                className="h-[9px] w-8 bg-[repeating-linear-gradient(90deg,var(--archive-accent)_0_1px,transparent_1px_5px)]"
              />
              <motion.span>{timeLabel}</motion.span>
            </div>
            <span
              className={`ml-auto text-(--archive-muted) ${monoClass} text-[9px] leading-none tracking-[0.09em] [@container(max-width:640px)]:hidden`}
              aria-hidden="true"
            >
              FOLIA — RHINE LAB
            </span>
          </footer>
        </div>
      ) : null}
    </VisualizerShell>
  );
}
