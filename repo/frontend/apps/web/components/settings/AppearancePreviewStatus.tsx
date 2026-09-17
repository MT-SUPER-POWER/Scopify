"use client";

import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { useI18n } from "@/store/module/i18n";

export function AppearancePreviewStatus() {
  const { t } = useI18n();
  const { palette } = useAppearanceBackground();
  return (
    <div aria-live="polite" className="mt-3 flex items-center gap-2 text-xs">
      <span aria-hidden className="size-2 rounded-full bg-brand" />
      {t("appearance.preview.current", { name: t(`appearance.preset.${palette.id}`) })}
    </div>
  );
}
