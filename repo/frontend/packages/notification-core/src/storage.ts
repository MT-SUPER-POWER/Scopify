import type { InboxNotification, NotificationSource } from "@scopify/desktop-contract";
import { normalizeNotificationPreferences, object } from "./preferences";
import type { NotificationAccountState } from "./types";

export function readNotificationState(value: unknown): NotificationAccountState {
  const raw = object(value);
  const preferences = normalizeNotificationPreferences(raw.preferences);
  const sources = Object.keys(preferences.subscriptions);
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .filter((value): value is InboxNotification => {
      const item = object(value);
      return (
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.body === "string" &&
        sources.includes(String(item.source)) &&
        ["messages", "interactions", "reports", "system"].includes(String(item.category)) &&
        typeof item.occurredAt === "number" &&
        Number.isFinite(item.occurredAt) &&
        (item.readAt === null || typeof item.readAt === "number") &&
        Array.isArray(item.details) &&
        item.details.every((line) => typeof line === "string")
      );
    })
    .slice(0, 500);
  const state: NotificationAccountState = {
    version: 1,
    preferences,
    items,
    deliveredReports: [],
    watermarks: {},
    nextChecks: {},
    cursors: {},
    lastCheckedAt: null,
  };
  state.deliveredReports = Array.isArray(raw.deliveredReports)
    ? raw.deliveredReports.filter((key): key is string => typeof key === "string")
    : [];
  for (const source of sources as NotificationSource[]) {
    for (const field of ["watermarks", "nextChecks"] as const) {
      const value = object(raw[field])[source];
      if (typeof value === "number" && Number.isFinite(value)) state[field][source] = value;
    }
    const cursor = object(object(raw.cursors)[source]);
    if (typeof cursor.head === "number" && Number.isFinite(cursor.head)) {
      const params: Record<string, string | number> = {};
      for (const [key, value] of Object.entries(object(cursor.params))) {
        if (
          ["limit", "uid", "offset", "before", "lasttime"].includes(key) &&
          (typeof value === "string" || typeof value === "number")
        )
          params[key] = value;
      }
      state.cursors[source] = { params, head: cursor.head };
    }
  }
  if (typeof raw.lastCheckedAt === "number") state.lastCheckedAt = raw.lastCheckedAt;
  return state;
}
