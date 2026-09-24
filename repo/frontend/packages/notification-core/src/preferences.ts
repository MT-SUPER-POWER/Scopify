import type { NotificationPreferences } from "@scopify/desktop-contract";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  subscriptions: {
    private: true,
    comments: true,
    mentions: true,
    notices: true,
    daily: false,
    weekly: true,
    yearly: true,
  },
  updates: true,
  desktop: false,
  sound: false,
  preview: false,
  doNotDisturb: false,
  quietHours: true,
  quietStart: "23:00",
  quietEnd: "08:00",
  dailyTime: "21:00",
};

export function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeNotificationPreferences(value: unknown): NotificationPreferences {
  const raw = object(value);
  const result = structuredClone(DEFAULT_NOTIFICATION_PREFERENCES);
  for (const key of [
    "updates",
    "desktop",
    "sound",
    "preview",
    "doNotDisturb",
    "quietHours",
  ] as const) {
    if (typeof raw[key] === "boolean") result[key] = raw[key];
  }
  for (const key of ["quietStart", "quietEnd", "dailyTime"] as const) {
    if (typeof raw[key] === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw[key]))
      result[key] = raw[key];
  }
  const subscriptions = object(raw.subscriptions);
  for (const key of Object.keys(
    result.subscriptions,
  ) as (keyof NotificationPreferences["subscriptions"])[]) {
    if (typeof subscriptions[key] === "boolean") result.subscriptions[key] = subscriptions[key];
  }
  return result;
}

export function isNotificationQuiet(preferences: NotificationPreferences, now = new Date()) {
  if (preferences.doNotDisturb) return true;
  if (!preferences.quietHours) return false;
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const { quietStart: start, quietEnd: end } = preferences;
  return start === end || (start < end ? time >= start && time < end : time >= start || time < end);
}
