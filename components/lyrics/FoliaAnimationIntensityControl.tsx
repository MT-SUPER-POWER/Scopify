"use client";

import { useI18n } from "@/store/module/i18n";

import type { Theme } from "@/components/lyrics/folia/src/types";
import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";

interface FoliaAnimationIntensityControlProps {
  isDaylight: boolean;
  theme: Theme;
}

export function FoliaAnimationIntensityControl({
  isDaylight,
  theme,
}: FoliaAnimationIntensityControlProps) {
  const { t } = useI18n();
  const { animationIntensity, cycleAnimationIntensity } = useFoliaPanelControls();
  const activeOptionBg = isDaylight
    ? "bg-white shadow-sm hover:bg-white/90"
    : "bg-white/20 shadow-sm hover:bg-white/30";

  return (
    <button
      className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${activeOptionBg}`}
      onClick={cycleAnimationIntensity}
      style={{ color: theme.primaryColor }}
      title={String(t("folia.options.animationIntensity"))}
      type="button"
    >
      {t(`folia.animation.${animationIntensity}`)}
    </button>
  );
}
