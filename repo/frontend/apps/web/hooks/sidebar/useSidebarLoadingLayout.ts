"use client";

import { useSyncExternalStore } from "react";
import { DASHBOARD_LAYOUT_GROUP_ID, SIDEBAR_DEFAULT_SIZE_PERCENT } from "@/constants/layout";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";

const LAYOUT_STORAGE_KEY = `react-resizable-panels:${DASHBOARD_LAYOUT_GROUP_ID}`;

function subscribe() {
  return () => undefined;
}

function readSavedSidebarSize() {
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    // The sidebar is the first panel in the persisted { [panelId]: percent } layout.
    const size = raw ? Object.values(JSON.parse(raw) as Record<string, number>)[0] : undefined;
    return typeof size === "number" && size > 0 ? size : SIDEBAR_DEFAULT_SIZE_PERCENT;
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
