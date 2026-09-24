import { create } from "zustand";
import type { FoliaSettingsStore } from "@/types/foliaSettings";

/** Transient global surfaces; opening settings never changes Stage visibility. */
export const useFoliaSettingsStore = create<FoliaSettingsStore>((set, get) => ({
  visualSection: null,
  themeLibraryOpen: false,
  themeCloseRequest: 0,
  fontPickerTarget: null,
  openVisualSettings: (section = "common") =>
    set((state) => ({
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
    set({ themeLibraryOpen: true, fontPickerTarget: null, themeCloseRequest: 0 }),
  closeThemeLibrary: () => set({ themeLibraryOpen: false, themeCloseRequest: 0 }),
  toggleThemeLibrary: () => {
    if (get().themeLibraryOpen) {
      // The workbench owns dirty-draft confirmation, including shortcut dismissal.
      set((state) => ({ themeCloseRequest: state.themeCloseRequest + 1 }));
    } else get().openThemeLibrary();
  },
  setFontPickerTarget: (fontPickerTarget) => set({ fontPickerTarget }),
}));
