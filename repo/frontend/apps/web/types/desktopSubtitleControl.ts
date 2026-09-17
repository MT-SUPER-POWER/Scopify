import type {
  DesktopLyricPreferences,
  DesktopLyricPreferencesUpdate,
} from "@scopify/desktop-contract";

export interface DesktopSubtitleControlStore {
  open: boolean;
  busy: boolean;
  failed: boolean;
  preferences: DesktopLyricPreferences | null;
  setOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  toggle: () => Promise<void>;
  close: () => Promise<void>;
  configure: (patch: DesktopLyricPreferencesUpdate) => Promise<void>;
}
