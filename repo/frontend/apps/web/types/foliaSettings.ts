import type { FoliaStageEditSection } from "@/types/foliaStage";

export interface FoliaSettingsStore {
  visualSection: FoliaStageEditSection | null;
  themeLibraryOpen: boolean;
  themeCloseRequest: number;
  fontPickerTarget: "lyrics" | "subtitle" | null;
  openVisualSettings(section?: FoliaStageEditSection): void;
  closeVisualSettings(): void;
  toggleVisualSettings(): void;
  openThemeLibrary(): void;
  closeThemeLibrary(): void;
  toggleThemeLibrary(): void;
  setFontPickerTarget(target: "lyrics" | "subtitle" | null): void;
}
