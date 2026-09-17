"use client";

import { LYRICS_PREVIEW_FONTS } from "@/constants/appearance";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { LyricsPreviewFont } from "@/types/appearance";
import { AppearanceRange } from "./AppearanceRange";
import { SettingRow, SettingSection, SettingSelect } from "./SettingsUI";

export function LyricsStyleSettingsSection() {
  const { t } = useI18n();
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  const update = useAppearanceStore((state) => state.updateLyricsPreview);
  const reset = useAppearanceStore((state) => state.resetLyricsPreview);
  return (
    <SettingSection title={t("appearance.lyrics")}>
      <SettingRow
        label={t("appearance.lyrics.font")}
        control={
          <SettingSelect
            value={settings.font}
            onChange={(font) => update({ font: font as LyricsPreviewFont })}
          >
            {(Object.keys(LYRICS_PREVIEW_FONTS) as LyricsPreviewFont[]).map((font) => (
              <option key={font} value={font} className="bg-popover">
                {t(`appearance.lyrics.font.${font}`)}
              </option>
            ))}
          </SettingSelect>
        }
      />
      <AppearanceRange
        label={t("appearance.lyrics.size")}
        value={settings.fontSize}
        min={16}
        max={40}
        unit=" px"
        onChange={(fontSize) => update({ fontSize })}
      />
      <SettingRow
        label={t("appearance.lyrics.color")}
        control={
          <input
            aria-label={t("appearance.lyrics.color")}
            type="color"
            value={settings.color}
            onChange={(event) => update({ color: event.target.value })}
            className="h-9 w-16 cursor-pointer rounded border border-input bg-transparent p-1"
          />
        }
      />
      <AppearanceRange
        label={t("appearance.lyrics.backdrop")}
        value={settings.backdropOpacity}
        min={0}
        max={100}
        unit="%"
        onChange={(backdropOpacity) => update({ backdropOpacity })}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded px-2 py-1 text-xs text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("appearance.reset")}
        </button>
      </div>
    </SettingSection>
  );
}
