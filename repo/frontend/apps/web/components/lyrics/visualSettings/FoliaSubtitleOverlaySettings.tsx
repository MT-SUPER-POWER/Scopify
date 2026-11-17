"use client";

import {
  FoliaSettingsGroup,
  FoliaSettingsRange,
  FoliaSettingsRow,
  FoliaSettingsToggle,
} from "@scopify/ui/scopify/components/folia-studio/settings";
import { useTranslation } from "react-i18next";
import {
  getSubtitleOverlayRows,
  SUBTITLE_OVERLAY_FIRST_ROWS,
  SUBTITLE_OVERLAY_FOLLOW_ROWS,
  subtitleOverlayPreviewsUpcoming,
  withSubtitleOverlayRow,
  withSubtitleOverlayRowCount,
  withSubtitleOverlayUpcomingPreview,
} from "@/lib/lyrics/subtitleOverlayLayout";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { SubtitleOverlayRowSource } from "@/types/lyrics/folia/subtitleTrack";

const ROW_COUNTS = [0, 1, 2, 3] as const;
const ROW_COUNT_LABELS = [
  "folia.options.subtitleOverlayRowsNone",
  "folia.options.subtitleOverlayRowsOne",
  "folia.options.subtitleOverlayRowsTwo",
  "folia.options.subtitleOverlayRowsThree",
] as const;
const ROW_LABELS = [
  "folia.options.subtitleOverlayRow1",
  "folia.options.subtitleOverlayRow2",
  "folia.options.subtitleOverlayRow3",
] as const;
const SOURCE_LABELS = {
  current: "folia.options.subtitleOverlaySourceCurrent",
  next: "folia.options.subtitleOverlaySourceNext",
  translation: "folia.options.subtitleContentTranslation",
  romanization: "folia.options.subtitleContentRomanization",
} as const;
const SELECT_CLASS = "max-w-44 rounded-lg bg-[var(--st-fill)] px-2 py-1.5 text-sm";

export function FoliaSubtitleOverlaySettings() {
  const { t } = useTranslation();
  const layout = useLyricStageStore((state) => state.subtitleOverlayLayout);
  const hidden = useLyricStageStore((state) => state.hideTranslationSubtitle);
  const background = useLyricStageStore((state) => state.subtitleOverlayBackground);
  const opacity = useLyricStageStore((state) => state.subtitleOverlayOpacity);
  const scale = useLyricStageStore((state) => state.subtitleFontScale);
  const blurUpcoming = useLyricStageStore((state) => state.subtitleUpcomingLyricsBlur);
  const patchSettings = useLyricStageStore((state) => state.patchSettings);
  const rows = getSubtitleOverlayRows(layout);

  return (
    <FoliaSettingsGroup title={t("folia.options.previewSubtitleSettings")}>
      <FoliaSettingsToggle
        label={t("folia.options.hidePlayerTranslationSubtitle")}
        checked={hidden}
        onChange={(hideTranslationSubtitle) => patchSettings({ hideTranslationSubtitle })}
      />
      <FoliaSettingsRow label={t("folia.options.subtitleOverlayRows")}>
        <select
          aria-label={t("folia.options.subtitleOverlayRows")}
          value={rows.length}
          onChange={(event) => {
            const count = Number(event.target.value) as (typeof ROW_COUNTS)[number];
            patchSettings({ subtitleOverlayLayout: withSubtitleOverlayRowCount(layout, count) });
          }}
          className={SELECT_CLASS}
        >
          {ROW_COUNTS.map((count) => (
            <option key={count} value={count}>
              {t(ROW_COUNT_LABELS[count])}
            </option>
          ))}
        </select>
      </FoliaSettingsRow>
      {rows.map((source, index) => {
        const label = t(ROW_LABELS[index]);
        const choices = index === 0 ? SUBTITLE_OVERLAY_FIRST_ROWS : SUBTITLE_OVERLAY_FOLLOW_ROWS;
        return (
          <FoliaSettingsRow key={index} label={label}>
            <select
              aria-label={label}
              value={source}
              onChange={(event) =>
                patchSettings({
                  subtitleOverlayLayout: withSubtitleOverlayRow(
                    layout,
                    index,
                    event.target.value as SubtitleOverlayRowSource,
                  ),
                })
              }
              className={SELECT_CLASS}
            >
              {choices.map((choice) => (
                <option key={choice} value={choice}>
                  {t(SOURCE_LABELS[choice])}
                </option>
              ))}
            </select>
          </FoliaSettingsRow>
        );
      })}
      <FoliaSettingsToggle
        label={t("folia.options.subtitleOverlayUpcomingFallback")}
        checked={subtitleOverlayPreviewsUpcoming(layout)}
        onChange={(enabled) =>
          patchSettings({
            subtitleOverlayLayout: withSubtitleOverlayUpcomingPreview(layout, enabled),
          })
        }
      />
      <FoliaSettingsToggle
        label={t("folia.options.subtitleUpcomingLyricsBlur")}
        checked={blurUpcoming}
        onChange={(subtitleUpcomingLyricsBlur) => patchSettings({ subtitleUpcomingLyricsBlur })}
      />
      <FoliaSettingsToggle
        label={t("folia.options.subtitleOverlayBackground")}
        checked={background}
        onChange={(subtitleOverlayBackground) => patchSettings({ subtitleOverlayBackground })}
      />
      <FoliaSettingsRange
        label={t("folia.options.subtitleOverlayOpacity")}
        value={opacity}
        min={0.2}
        max={1}
        step={0.05}
        valueText={`${Math.round(opacity * 100)}%`}
        onChange={(subtitleOverlayOpacity) => patchSettings({ subtitleOverlayOpacity })}
      />
      <FoliaSettingsRange
        label={t("folia.options.subtitleFontScale")}
        value={scale}
        min={0.85}
        max={1.4}
        step={0.05}
        valueText={`${Math.round(scale * 100)}%`}
        onChange={(subtitleFontScale) => patchSettings({ subtitleFontScale })}
      />
    </FoliaSettingsGroup>
  );
}
