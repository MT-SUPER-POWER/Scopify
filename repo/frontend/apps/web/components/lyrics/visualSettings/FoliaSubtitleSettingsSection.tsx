"use client";

import {
  FoliaSettingsGroup,
  FoliaSettingsRow,
  FoliaSettingsToggle,
} from "@scopify/ui/scopify/components/folia-studio/settings";
import { FoliaHarmonySettingsCard } from "@/components/lyrics/visualSettings/FoliaHarmonySettingsCard";
import { FoliaSubtitleOverlaySettings } from "@/components/lyrics/visualSettings/FoliaSubtitleOverlaySettings";
import type { FoliaVisualSettingsSectionProps } from "@/types/lyrics/folia/visualSettings";

export function FoliaSubtitleSettingsSection({ model: m }: FoliaVisualSettingsSectionProps) {
  const { t } = m;
  const contentOptions = [
    { value: "translation", label: t("folia.options.subtitleContentTranslation") },
    { value: "romanization", label: t("folia.options.subtitleContentRomanization") },
    { value: "both", label: t("folia.options.subtitleContentBoth") },
    { value: "none", label: t("folia.options.subtitleContentNone") },
  ];
  return (
    <>
      <FoliaSubtitleOverlaySettings />
      <FoliaSettingsGroup title={t("folia.options.subtitleFontFamily")}>
        <FoliaSettingsRow label={t("folia.options.subtitleContentMode")}>
          <select
            aria-label={t("folia.options.subtitleContentMode")}
            value={m.subtitleContentMode}
            onChange={(e) =>
              m.onSubtitleContentModeChange(e.target.value as typeof m.subtitleContentMode)
            }
            className="max-w-40 rounded-lg bg-[var(--st-fill)] px-2 py-1.5 text-sm"
          >
            {contentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FoliaSettingsRow>
        <FoliaSettingsToggle
          label={t("folia.options.subtitleFontInheritsLyrics")}
          checked={m.subtitleFontInheritsLyrics}
          onChange={m.onSubtitleFontInheritsLyricsChange}
        />
        {!m.subtitleFontInheritsLyrics ? (
          <FoliaSettingsRow label={t("folia.options.subtitleFontFamily")}>
            <select
              aria-label={t("folia.options.subtitleFontFamily")}
              value={m.subtitleFontFamily ? "custom" : m.subtitleFontStyle}
              className="max-w-44 rounded-lg bg-[var(--st-fill)] px-2 py-1.5 text-sm"
              onChange={(e) => {
                const value = e.target.value;
                if (value === "custom") m.onOpenSubtitleFontPicker();
                else {
                  m.onSubtitleFontFamilyChange(null);
                  m.onSubtitleFontStyleChange(value as typeof m.subtitleFontStyle);
                }
              }}
            >
              {m.subtitleFontStyleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FoliaSettingsRow>
        ) : null}
      </FoliaSettingsGroup>
      {!m.subtitleFontInheritsLyrics && m.subtitleFontFamily ? (
        <button
          type="button"
          onClick={m.onOpenSubtitleFontPicker}
          className="rounded-lg bg-[var(--st-fill)] px-3 py-2 text-xs"
        >
          {t("folia.options.customFont")}
        </button>
      ) : null}
      <FoliaHarmonySettingsCard controlCardBg="var(--st-card)" theme={m.theme} />
    </>
  );
}
