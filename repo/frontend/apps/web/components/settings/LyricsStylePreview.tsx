"use client";

import { LYRICS_PREVIEW_FONTS } from "@/constants/appearance";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";

export function LyricsStylePreview() {
  const { t } = useI18n();
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  return (
    <div className="space-y-3">
      <div
        className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-border bg-cover bg-center px-5"
        style={{
          backgroundImage: 'url("/images/appearance/misty-mountains.png")',
          containerType: "inline-size",
        }}
      >
        <div
          className="max-w-full rounded-md px-4 py-2.5 text-center leading-snug whitespace-nowrap"
          style={{
            backgroundColor: `rgb(0 0 0 / ${settings.backdropOpacity}%)`,
            color: settings.color,
            fontFamily: LYRICS_PREVIEW_FONTS[settings.font],
            fontSize: `clamp(12px, ${settings.fontSize / 5.6}cqw, ${settings.fontSize}px)`,
            textShadow: "0 1px 4px rgb(0 0 0 / 35%)",
          }}
        >
          {t("appearance.lyrics.text")}
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("appearance.lyrics.note")}</p>
    </div>
  );
}
