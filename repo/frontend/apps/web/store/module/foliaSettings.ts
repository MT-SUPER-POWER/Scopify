import { create } from "zustand";
import type { FoliaSettingsStore } from "@/types/foliaSettings";

/** Transient global surfaces; opening settings never changes Stage visibility. */
export const useFoliaSettingsStore = create<FoliaSettingsStore>((set, get) => ({
  stagePanelOpen: false,
  visualSection: null,
  themeLibraryOpen: false,
  themeCloseRequest: 0,
  fontPickerTarget: null,
  setStagePanelOpen: (stagePanelOpen) => set({ stagePanelOpen }),
  toggleStagePanel: () => set((state) => ({ stagePanelOpen: !state.stagePanelOpen })),
  openVisualSettings: (section = "visualizer") =>
    set((state) => ({
      stagePanelOpen: false,
      visualSection: section,
      themeCloseRequest: state.themeCloseRequest + (state.themeLibraryOpen ? 1 : 0),
    })),
  closeVisualSettings: () => set({ visualSection: null, fontPickerTarget: null }),
  toggleVisualSettings: () => {
    const state = get();
    if (state.themeLibraryOpen) {
      state.openVisualSettings();
      return;
    }
    if (state.visualSection) state.closeVisualSettings();
    else state.openVisualSettings();
  },
  openThemeLibrary: () =>
    set({
      stagePanelOpen: false,
      themeLibraryOpen: true,
      fontPickerTarget: null,
      themeCloseRequest: 0,
    }),
  closeThemeLibrary: () => set({ themeLibraryOpen: false, themeCloseRequest: 0 }),
  toggleThemeLibrary: () => {
    if (get().themeLibraryOpen) {
      // The workbench owns dirty-draft confirmation, including shortcut dismissal.
      set((state) => ({ themeCloseRequest: state.themeCloseRequest + 1 }));
    } else get().openThemeLibrary();
  },
  setFontPickerTarget: (fontPickerTarget) => set({ fontPickerTarget }),
}));
