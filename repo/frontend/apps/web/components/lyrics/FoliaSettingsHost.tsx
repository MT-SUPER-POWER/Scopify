"use client";

import { buildAppStyle } from "@/components/lyrics/folia/src/components/app/presentation/buildAppStyle";
import { createPortal } from "react-dom";
import { FoliaFontPicker } from "@/components/lyrics/FoliaFontPicker";
import { FoliaSonnetPerformanceWarningDialog } from "@/components/lyrics/FoliaSonnetPerformanceWarningDialog";
import { FoliaThemeLibraryDialog } from "@/components/lyrics/FoliaThemeLibraryDialog";
import { FoliaVisualSettingsDialog } from "@/components/lyrics/FoliaVisualSettingsDialog";
import { useFoliaPresentationAppearance } from "@/hooks/player/useFoliaPresentationAppearance";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";

export function FoliaSettingsHost() {
  const { assets, isDaylight, settings, theme } = useFoliaPresentationAppearance();
  const surfaces = useFoliaSettingsStore();
  return createPortal(
    <div
      className="text-white"
      style={buildAppStyle({
        bgMode: "default",
        isDaylight,
        theme,
        daylightTheme: theme,
        defaultTheme: theme,
        transparentBackground: true,
      })}
    >
      <FoliaVisualSettingsDialog
        assets={assets}
        isOpen={surfaces.visualSection !== null && !surfaces.themeLibraryOpen}
        onClose={surfaces.closeVisualSettings}
        onOpenFontPicker={surfaces.setFontPickerTarget}
        onOpenThemeLibrary={surfaces.openThemeLibrary}
        onSectionChange={surfaces.openVisualSettings}
        section={surfaces.visualSection ?? "common"}
        theme={theme}
      />
      <FoliaThemeLibraryDialog
        assets={assets}
        isOpen={surfaces.themeLibraryOpen}
        onClose={surfaces.closeThemeLibrary}
        theme={theme}
      />
      {surfaces.fontPickerTarget ? (
        <FoliaFontPicker
          assets={assets}
          onClose={() => surfaces.setFontPickerTarget(null)}
          target={surfaces.fontPickerTarget}
        />
      ) : null}
      <FoliaSonnetPerformanceWarningDialog
        dontShowAgain={settings.sonnetPerformanceWarningDontShowAgain}
        isDaylight={isDaylight}
        isOpen={settings.sonnetPerformanceWarningOpen}
        onClose={settings.cancelSonnetPerformanceWarning}
        onConfirm={settings.confirmSonnetPerformanceWarning}
        onDontShowAgainChange={settings.setSonnetPerformanceWarningDontShowAgain}
      />
    </div>,
    document.body,
  );
}
