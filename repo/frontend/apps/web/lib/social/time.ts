export function formatSocialTime(timestamp: number, locale: string, now = Date.now()) {
  const minutes = Math.max(1, Math.floor((now - timestamp) / 60_000));
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (minutes < 60) return relative.format(-minutes, "minute");
  if (minutes < 1440) return relative.format(-Math.floor(minutes / 60), "hour");
  if (minutes < 10080) return relative.format(-Math.round(minutes / 1440), "day");
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    ...(new Date(timestamp).getFullYear() !== new Date(now).getFullYear()
      ? { year: "numeric" as const }
      : {}),
  }).format(timestamp);
}
