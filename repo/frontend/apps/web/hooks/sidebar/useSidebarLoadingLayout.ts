"use client";

import { useSyncExternalStore } from "react";
import {
  DASHBOARD_LAYOUT_GROUP_ID,
  DASHBOARD_PANEL_IDS,
  NOW_PLAYING_PANEL_MEDIA_QUERY,
  SIDEBAR_DEFAULT_SIZE_PERCENT,
} from "@/constants/layout";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";

// react-resizable-panels keys each rendered panel set separately: `<prefix>:<group>:<id>:<id>...`.
const LAYOUT_STORAGE_PREFIX = `react-resizable-panels:${DASHBOARD_LAYOUT_GROUP_ID}`;
const UI_STORAGE_KEY = "ui-storage";

function subscribe() {
  return () => undefined;
}

function readNowPlayingPanelPreference() {
  try {
    const raw = window.localStorage.getItem(UI_STORAGE_KEY);
    const state = raw ? (JSON.parse(raw) as { state?: { isNowPlayingPanelOpen?: boolean } }) : null;
    return state?.state?.isNowPlayingPanelOpen ?? true;
  } catch {
    return true;
  }
}

function readLayoutSize(key: string) {
  const raw = window.localStorage.getItem(key);
  // The sidebar is the first panel in the persisted { [panelId]: percent } layout.
  const size = raw ? Object.values(JSON.parse(raw) as Record<string, number>)[0] : undefined;
  return typeof size === "number" && size > 0 ? size : undefined;
}

function readSavedSidebarSize() {
  try {
    const panelIds: string[] = [DASHBOARD_PANEL_IDS.sidebar, DASHBOARD_PANEL_IDS.main];
    if (
      readNowPlayingPanelPreference() &&
      window.matchMedia(NOW_PLAYING_PANEL_MEDIA_QUERY).matches
    ) {
      panelIds.push(DASHBOARD_PANEL_IDS.nowPlaying);
    }
    return (
      readLayoutSize([LAYOUT_STORAGE_PREFIX, ...panelIds].join(":")) ??
      readLayoutSize(LAYOUT_STORAGE_PREFIX) ??
      SIDEBAR_DEFAULT_SIZE_PERCENT
    );
  } catch {
    return SIDEBAR_DEFAULT_SIZE_PERCENT;
  }
}

/** Sidebar geometry for placeholders rendered before the resizable layout and stores mount. */
export function useSidebarLoadingLayout() {
  const sizePercent = useSyncExternalStore(
    subscribe,
    readSavedSidebarSize,
    () => SIDEBAR_DEFAULT_SIZE_PERCENT,
  );
  const hasSession = useSyncExternalStore(
    subscribe,
    () => Boolean(getMusicSessionCredential()),
    () => false,
  );
  return { hasSession, sizePercent };
}
