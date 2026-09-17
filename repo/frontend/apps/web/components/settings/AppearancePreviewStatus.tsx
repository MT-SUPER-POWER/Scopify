"use client";

import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { useThemeOptions } from "@/hooks/settings/useThemeOptions";
import { useI18n } from "@/store/module/i18n";

export function AppearancePreviewStatus() {
  const { t } = useI18n();
  const { palette } = useAppearanceBackground();
  const options = useThemeOptions();
  const name =
    options.find((option) => option.id === palette.id)?.name ?? t("appearance.preset.custom");
  return (
    <div aria-live="polite" className="mt-3 flex items-center gap-2 text-xs">
      <span aria-hidden className="size-2 rounded-full bg-brand" />
      {t("appearance.preview.current", { name })}
    </div>
  );
}
