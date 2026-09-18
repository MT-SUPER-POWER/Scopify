"use client";

import { useRouter } from "next/navigation";
import { BACKGROUND_THEME_EDITOR_PATH } from "@/constants/appearanceRoutes";
import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { useThemeOptions } from "@/hooks/settings/useThemeOptions";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import { SavedThemeLibrary } from "./SavedThemeLibrary";
import { ThemeCard } from "./ThemeCard";

export function BackgroundThemePicker() {
  const { t } = useI18n();
  const { palette } = useAppearanceBackground();
  const options = useThemeOptions();
  const apply = useAppearanceStore((state) => state.applyTheme);
  const router = useRouter();
  const createTheme = () => router.push(BACKGROUND_THEME_EDITOR_PATH);
  return (
    <div className="mb-8 space-y-7">
      <fieldset>
        <legend className="mb-4 text-base font-medium text-foreground">
          {t("appearance.library.builtin")}
        </legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
          {options
            .filter((theme) => !theme.id.startsWith("user:"))
            .map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={palette.id === theme.id}
                onSelect={() => apply(theme.id)}
                onView={() =>
                  router.push(`${BACKGROUND_THEME_EDITOR_PATH}?id=${encodeURIComponent(theme.id)}`)
                }
              />
            ))}
        </div>
      </fieldset>
      <SavedThemeLibrary
        activeId={palette.id}
        onCreate={createTheme}
        onEdit={(theme) =>
          router.push(`${BACKGROUND_THEME_EDITOR_PATH}?id=${encodeURIComponent(theme.id)}`)
        }
      />
    </div>
  );
}
