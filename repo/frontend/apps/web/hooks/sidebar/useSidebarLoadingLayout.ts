"use client";

import { useSyncExternalStore } from "react";
import {
  DASHBOARD_LAYOUT_GROUP_ID,
  DASHBOARD_PANEL_IDS,
  NOW_PLAYING_PANEL_DEFAULT_SIZE_PERCENT,
  SIDEBAR_DEFAULT_SIZE_PERCENT,
} from "@/constants/layout";
import { readNowPlayingLoadingState } from "@/lib/layout/nowPlayingLoadingState";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";

// react-resizable-panels keys each rendered panel set separately: `<prefix>:<group>:<id>:<id>...`.
const LAYOUT_STORAGE_PREFIX = `react-resizable-panels:${DASHBOARD_LAYOUT_GROUP_ID}`;

function subscribe() {
  return () => undefined;
}

function readLayoutSize(key: string, panelId: string = DASHBOARD_PANEL_IDS.sidebar) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return undefined;
  const layout = JSON.parse(raw) as Record<string, number>;
  // Legacy layouts were saved without panel ids; the sidebar was their first entry.
  const size =
    layout[panelId] ??
    (panelId === DASHBOARD_PANEL_IDS.sidebar ? Object.values(layout)[0] : undefined);
  return typeof size === "number" && size > 0 ? size : undefined;
}

function readSavedNowPlayingSize() {
  try {
    const key = [
      LAYOUT_STORAGE_PREFIX,
      DASHBOARD_PANEL_IDS.sidebar,
      DASHBOARD_PANEL_IDS.main,
      DASHBOARD_PANEL_IDS.nowPlaying,
    ].join(":");
    return (
      readLayoutSize(key, DASHBOARD_PANEL_IDS.nowPlaying) ?? NOW_PLAYING_PANEL_DEFAULT_SIZE_PERCENT
    );
  } catch {
    return NOW_PLAYING_PANEL_DEFAULT_SIZE_PERCENT;
  }
}

function readSavedSidebarSize() {
  try {
    const panelIds: string[] = [DASHBOARD_PANEL_IDS.sidebar, DASHBOARD_PANEL_IDS.main];
    // 折叠成窄条时右栏仍在面板组中，与展开时共用同一份布局
    if (readNowPlayingLoadingState() !== null) {
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

/** Sidebar and Now Playing geometry for placeholders rendered before the resizable layout and stores mount. */
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
  const nowPlaying = useSyncExternalStore(subscribe, readNowPlayingLoadingState, () => null);
  const nowPlayingSizePercent = useSyncExternalStore(
    subscribe,
    readSavedNowPlayingSize,
    () => NOW_PLAYING_PANEL_DEFAULT_SIZE_PERCENT,
  );
  return { hasSession, nowPlaying, nowPlayingSizePercent, sizePercent };
}
