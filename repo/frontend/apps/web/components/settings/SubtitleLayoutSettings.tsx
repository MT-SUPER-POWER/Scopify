"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";

import { Switch } from "@scopify/ui/shadcn/components/switch";
import { LYRICS_PREVIEW_FONTS } from "@/constants/appearance";
import type { SubtitleSettingsEditorProps } from "@/types/subtitle-preview";
import { useI18n } from "@/store/module/i18n";
import type { LyricsPreviewFont, LyricsPreviewSettings } from "@/types/appearance";
import { AppearanceRange } from "./AppearanceRange";
import { SettingRow } from "./SettingsUI";

export function SubtitleLayoutSettings({
  settings,
  onChange: update,
}: SubtitleSettingsEditorProps) {
  const { t } = useI18n();
  return (
    <div>
      <SettingRow
        label={t("appearance.lyrics.font")}
        control={
          <Select
            value={String(settings.font)}
            onValueChange={(font) => update({ font: font as LyricsPreviewFont })}
          >
            <SelectTrigger aria-label={t("appearance.lyrics.font")} className="min-w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {(Object.keys(LYRICS_PREVIEW_FONTS) as LyricsPreviewFont[]).map((font) => (
                <SelectItem key={font} value={String(font)}>
                  {t(`appearance.lyrics.font.${font}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <AppearanceRange
        label={t("appearance.lyrics.size")}
        value={settings.fontSize}
        min={16}
        max={64}
        unit=" px"
        onChange={(fontSize) => update({ fontSize })}
      />
      <AppearanceRange
        label={t("subtitlePreview.weight")}
        value={settings.fontWeight}
        min={300}
        max={800}
        step={100}
        onChange={(fontWeight) => update({ fontWeight })}
      />
      <SettingRow
        label={t("subtitlePreview.translation")}
        control={
          <Switch
            aria-label={t("subtitlePreview.translation")}
            checked={settings.showTranslation}
            onCheckedChange={(showTranslation) => update({ showTranslation })}
          />
        }
      />
      {settings.showTranslation && (
        <>
          <AppearanceRange
            label={t("subtitlePreview.secondarySize")}
            value={settings.secondarySize}
            min={12}
            max={40}
            unit=" px"
            onChange={(secondarySize) => update({ secondarySize })}
          />
          <SettingRow
            label={t("subtitlePreview.collapse")}
            control={
              <Switch
                aria-label={t("subtitlePreview.collapse")}
                checked={settings.autoCollapseChinese}
                onCheckedChange={(autoCollapseChinese) => update({ autoCollapseChinese })}
              />
            }
          />
        </>
      )}
      <SettingRow
        label={t("subtitlePreview.align")}
        control={
          <Select
            value={String(settings.textAlign)}
            onValueChange={(textAlign) =>
              update({ textAlign: textAlign as LyricsPreviewSettings["textAlign"] })
            }
          >
            <SelectTrigger aria-label={t("subtitlePreview.align")} className="min-w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {(["left", "center", "right"] as const).map((align) => (
                <SelectItem key={align} value={String(align)}>
                  {t(`subtitlePreview.${align}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <AppearanceRange
        label={t("subtitlePreview.width")}
        value={settings.maxWidth}
        min={240}
        max={1400}
        step={20}
        unit=" px"
        onChange={(maxWidth) => update({ maxWidth })}
      />
      <AppearanceRange
        label={t("subtitlePreview.paddingX")}
        value={settings.paddingX}
        min={0}
        max={48}
        unit=" px"
        onChange={(paddingX) => update({ paddingX })}
      />
      <AppearanceRange
        label={t("subtitlePreview.paddingY")}
        value={settings.paddingY}
        min={0}
        max={32}
        unit=" px"
        onChange={(paddingY) => update({ paddingY })}
      />
      <AppearanceRange
        label={t("subtitlePreview.radius")}
        value={settings.radius}
        min={0}
        max={48}
        unit=" px"
        onChange={(radius) => update({ radius })}
      />
    </div>
  );
}
