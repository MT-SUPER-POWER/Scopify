import { BACKGROUND_PRESETS } from "@/constants/appearance";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { ThemeOption } from "@/types/appearance";

export function useThemeOptions(): ThemeOption[] {
  const { t } = useI18n();
  const themes = useAppearanceStore((state) => state.themes);
  return [
    ...BACKGROUND_PRESETS.map((theme) => ({ ...theme, name: t(`appearance.preset.${theme.id}`) })),
    ...themes,
  ];
}
