"use client";

import { AnimatePresence } from "framer-motion";
import {
  FoliaStudioColumns,
  FoliaStudioWindow,
} from "@scopify/ui/scopify/components/folia-studio/window";
import { useFoliaModalFocus } from "@/hooks/lyrics/useFoliaModalFocus";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useI18n } from "@/store/module/i18n";
import { FoliaSettingsPreview } from "@/components/lyrics/FoliaSettingsPreview";
import { FoliaStyleShelf } from "@/components/lyrics/FoliaStyleShelf";
import { FoliaVisualSettingsPanel } from "@/components/lyrics/FoliaVisualSettingsPanel";
import { useFoliaStageSettingsPanel } from "@/hooks/player/useFoliaStageSettingsPanel";
import type { FoliaVisualSettingsDialogProps } from "@/types/lyrics/components";

/** Shared by the Stage and music-library entry points. */
export function FoliaVisualSettingsDialog({
  assets,
  isOpen,
  onClose,
  onOpenFontPicker,
  onOpenThemeLibrary,
  onSectionChange,
  section,
  theme,
}: FoliaVisualSettingsDialogProps) {
  const { t } = useI18n();
  const isDaylight = theme.name === "snow";
  const controlsTheme = {
    ...theme,
    backgroundColor: isDaylight ? "#f3f3f5" : "#1c1c1f",
    primaryColor: isDaylight ? "#171b27" : "#f0f0f3",
    secondaryColor: isDaylight ? "#71717a" : "#a1a1aa",
  };
  const model = useFoliaStageSettingsPanel(
    section,
    onSectionChange,
    controlsTheme,
    assets,
    onOpenFontPicker,
  );
  const fontPickerTarget = useFoliaSettingsStore((state) => state.fontPickerTarget);
  const warningOpen = useLyricStageStore((state) => state.sonnetPerformanceWarningOpen);
  const dialogRef = useFoliaModalFocus(isOpen && !fontPickerTarget && !warningOpen, onClose);
  return (
    <AnimatePresence>
      {isOpen ? (
        <FoliaStudioWindow
          panelRef={dialogRef}
          title={t("folia.options.lyricsStyleSettings")}
          backLabel={t("folia.ui.close")}
          onClose={onClose}
          isDaylight={model.isDaylight}
          colors={theme}
        >
          <FoliaStudioColumns
            stage={
              <>
                <div className="h-[min(42vh,396px)] min-h-60 shrink-0 lg:h-auto lg:min-h-0 lg:flex-[1.5]">
                  <FoliaSettingsPreview
                    className="min-h-0"
                    activeSection={section}
                    assets={assets}
                    onSectionChange={onSectionChange}
                    theme={theme}
                  />
                </div>
                <FoliaStyleShelf assets={assets} theme={theme} onSectionChange={onSectionChange} />
              </>
            }
          >
            <FoliaVisualSettingsPanel model={model} onOpenThemeLibrary={onOpenThemeLibrary} />
          </FoliaStudioColumns>
        </FoliaStudioWindow>
      ) : null}
    </AnimatePresence>
  );
}
