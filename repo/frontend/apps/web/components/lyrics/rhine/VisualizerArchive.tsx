"use client";

import { motion, useTransform } from "framer-motion";
import VisualizerShell from "@/components/lyrics/folia/src/components/visualizer/VisualizerShell";
import type { VisualizerSharedProps } from "@/components/lyrics/folia/src/components/visualizer/definition";
import { resolveThemeFontStack, resolveThemeTranslationFontStack, resolveThemeFontWeight } from "@/components/lyrics/folia/src/utils/fontStacks";
import { resolveLyricAlternateText, resolveSubtitleContentMode } from "@/components/lyrics/folia/src/utils/lyrics/alternateText";
import { useArchiveLyricMotion } from "@/hooks/lyrics/useArchiveLyricMotion";
import { formatArchiveTime } from "@/lib/lyrics/rhine/archiveLyrics";
import { useI18n } from "@/store/module/i18n";
import type { ArchiveVisualizerStyle } from "@/types/archiveLyrics";
import { ArchiveLyricLine } from "./ArchiveLyricLine";
import styles from "./VisualizerArchive.module.css";

export default function VisualizerArchive(props: VisualizerSharedProps) {
  const { t } = useI18n();
  const { lines, currentLineIndex, currentTime, theme, seed, paused = false, staticMode = false,
    showText = true, songTitle, songArtist, songAlbum, onLyricLineSeek } = props;
  const active = lines[currentLineIndex];
  const previous = currentLineIndex > 0 ? lines[currentLineIndex - 1] : undefined;
  const next = active ? lines[currentLineIndex + 1] : lines.find((line) => line.startTime > currentTime.get());
  const identity = `${seed ?? "archive"}:${active?.id ?? currentLineIndex}:${active?.startTime ?? "rest"}`;
  const { viewportRef, clipPath, y, opacity, reducedMotion } = useArchiveLyricMotion({ identity, paused, staticMode });
  const recordMotion = useArchiveLyricMotion({ identity: String(seed ?? "archive"), paused, staticMode });
  const timeLabel = useTransform(currentTime, formatArchiveTime);
  const lineProgress = useTransform(currentTime, (time) => active
    ? Math.max(0, Math.min(1, (time - active.startTime) / Math.max(.1, active.endTime - active.startTime))) : 0);
  const colorMode = props.background?.mode === "rhine" ? props.background.rhine?.tuning?.colorMode : "auto";
  const dark = colorMode === "dark" || (colorMode !== "light" && !props.isDaylight);
  const subtitleMode = resolveSubtitleContentMode(props.subtitleContentMode, props.showSubtitleTranslation ?? true);
  const subtitle = active && !props.hideTranslationSubtitle ? resolveLyricAlternateText(active, subtitleMode) : "";
  const style: ArchiveVisualizerStyle = {
    "--archive-font-scale": props.lyricsFontScale ?? 1,
    "--archive-subtitle-scale": props.subtitleFontScale ?? 1,
    fontFamily: resolveThemeFontStack({ ...theme, fontStyle: "sans" }),
  };

  return (
    <VisualizerShell theme={theme} audioPower={props.audioPower} audioBands={props.audioBands} sharedProps={props}>
      {showText ? (
        <div className={styles.stage} style={style} data-dark={dark} data-paused={paused}
          data-static={reducedMotion}>
          <div aria-hidden="true" className={styles.registration}><span /><span /><span /><span /></div>
          <header className={styles.header}>
            <div className={styles.brand}>
              <strong>SCOPIFY<span className={styles.brandSquare} /></strong>
              <span>RHINE / SOUND ARCHIVE</span>
            </div>
            <div className={styles.session}>
              <span className={styles.statusDot} />
              <span>{t(paused ? "folia.archive.suspended" : "folia.archive.reading")}</span>
            </div>
          </header>

          <section className={styles.record}>
            <motion.div className={styles.recordMeta} style={{ clipPath: recordMotion.clipPath }}>
              <span className={styles.indexLabel}>01 / {t("folia.archive.record")}</span>
              <h2 title={songTitle ?? undefined}>{songTitle || t("folia.archive.untitled")}</h2>
              <p title={[songArtist, songAlbum].filter(Boolean).join(" / ")}>
                {[songArtist, songAlbum].filter(Boolean).join(" / ") || "—"}
              </p>
            </motion.div>

            <div className={styles.reading}>
              <div className={styles.lineIndex} aria-hidden="true">
                <span>{String(Math.max(0, currentLineIndex + 1)).padStart(3, "0")}</span>
                <span className={styles.indexTrack}><motion.i style={{ scaleY: lineProgress }} /></span>
              </div>
              <div className={styles.lyricColumn}>
                <div className={styles.previous} key={`previous:${identity}`}>
                  {previous ? <button type="button" disabled={!onLyricLineSeek} onClick={() => onLyricLineSeek?.(previous.startTime)}
                    aria-label={`${t("folia.archive.seekLine")}: ${previous.fullText}`}>{previous.fullText}</button> : <span aria-hidden="true">—</span>}
                </div>
                <motion.div ref={viewportRef} className={styles.active} style={{ clipPath, y, opacity, fontWeight: resolveThemeFontWeight(theme, 600) }}
                  data-long={(active?.fullText.length ?? 0) > 48}>
                  {active ? <ArchiveLyricLine line={active} currentTime={currentTime} onSeek={onLyricLineSeek} seekLabel={t("folia.archive.seekLine")} />
                    : <p className={styles.interlude}>{lines.length ? t("folia.archive.interlude") : t("folia.archive.instrumental")}</p>}
                </motion.div>
                <div key={`subtitle:${identity}`} className={styles.subtitle} style={{ fontFamily: resolveThemeTranslationFontStack(props.subtitleTheme ?? theme), opacity: props.subtitleOverlayOpacity ?? 1 }}>
                  {subtitle || "\u00a0"}
                </div>
                <div className={styles.next}>
                  {next ? <button type="button" disabled={!onLyricLineSeek} onClick={() => onLyricLineSeek?.(next.startTime)}
                    aria-label={`${t("folia.archive.seekLine")}: ${next.fullText}`}><span aria-hidden="true">↳</span>{next.fullText}</button> : null}
                </div>
              </div>
            </div>
          </section>

          <footer className={styles.footer}>
            <span className={styles.footerLabel}>02 / {t("folia.archive.transcript")}</span>
            <div className={styles.timecode}><span aria-hidden="true" className={styles.timeMark} /><motion.span>{timeLabel}</motion.span></div>
            <span className={styles.footerNote} aria-hidden="true">FOLIA — RHINE LAB</span>
          </footer>
        </div>
      ) : null}
    </VisualizerShell>
  );
}
