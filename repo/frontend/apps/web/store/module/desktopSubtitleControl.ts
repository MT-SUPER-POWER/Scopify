"use client";

import { create } from "zustand";
import { runtime } from "@/lib/runtime";
import type { DesktopSubtitleControlStore } from "@/types/desktopSubtitleControl";

export const useDesktopSubtitleControl = create<DesktopSubtitleControlStore>((set, get) => ({
  open: false,
  busy: false,
  failed: false,
  preferences: null,
  setOpen: (open) => {
    set({ open });
    if (open) void get().refresh();
  },
  refresh: async () => {
    if (!runtime.isDesktop || get().busy) return;
    const previousPreferences = get().preferences;
    try {
      const preferences = await runtime.desktopLyrics.getPreferences();
      if (!get().busy && get().preferences === previousPreferences)
        set({ preferences, failed: !preferences });
    } catch {
      if (!get().busy && get().preferences === previousPreferences) set({ failed: true });
    }
  },
  toggle: async () => {
    if (!runtime.isDesktop || get().busy) return;
    set({ busy: true, failed: false });
    try {
      const enabled = await runtime.desktopLyrics.toggle();
      const preferences = await runtime.desktopLyrics.getPreferences();
      if (!preferences || Boolean(preferences.enabled) !== enabled)
        throw new Error("Desktop lyric state unavailable");
      set({ preferences });
    } catch {
      set({ failed: true, open: true });
    } finally {
      set({ busy: false });
    }
  },
  close: async () => {
    if (!runtime.isDesktop || get().busy) return;
    set({ busy: true, failed: false });
    try {
      if (!(await runtime.desktopLyrics.close())) throw new Error("Desktop lyric close failed");
    } catch {
      set({ failed: true });
    } finally {
      set({ busy: false });
    }
  },
  configure: async (patch) => {
    if (!runtime.isDesktop || get().busy) return;
    set({ busy: true, failed: false });
    try {
      const preferences = await runtime.desktopLyrics.updatePreferences(patch);
      if (!preferences) throw new Error("Desktop lyric preferences unavailable");
      set({ preferences });
    } catch {
      set({ failed: true });
    } finally {
      set({ busy: false });
    }
  },
}));
