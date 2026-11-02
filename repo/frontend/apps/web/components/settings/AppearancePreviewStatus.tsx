"use client";

import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { useThemeOptions } from "@/hooks/settings/useThemeOptions";
import { useTranslation } from "react-i18next";

export function AppearancePreviewStatus() {
  const { t } = useTranslation();
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
