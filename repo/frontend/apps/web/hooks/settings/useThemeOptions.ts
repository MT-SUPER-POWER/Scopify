import { BACKGROUND_PRESETS } from "@/constants/appearance";
import { useAppearanceStore } from "@/store/module/appearance";
import { useTranslation } from "react-i18next";

import type { ThemeOption } from "@/types/appearance/model";
import { useTheme } from "next-themes";

export function useThemeOptions(): ThemeOption[] {
  const { t } = useTranslation();
  const themes = useAppearanceStore((state) => state.themes);
  const { resolvedTheme } = useTheme();
  const variant = resolvedTheme === "light" ? "light" : "dark";
  return [
    ...BACKGROUND_PRESETS.map((theme) => ({
      id: theme.id,
      ...theme[variant],
      name: t(`appearance.preset.${theme.id}`),
    })),
    ...themes.map((theme) => ({ id: theme.id, name: theme.name, ...theme[variant] })),
  ];
}
