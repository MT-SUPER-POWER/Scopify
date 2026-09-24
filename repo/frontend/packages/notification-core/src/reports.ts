import type {
  InboxNotification,
  NotificationLocale,
  NotificationSource,
} from "@scopify/desktop-contract";
import { notificationCopy, notificationTitle } from "./copy";
import { object } from "./preferences";
import type { ReportPeriod } from "./types";

const DAY = 86_400_000;
const OFFSET = 8 * 3_600_000;
export function shanghaiDay(timestamp: number) {
  return new Date(timestamp + OFFSET).toISOString().slice(0, 10);
}
export function timestamp(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? (n < 100_000_000_000 ? n * 1000 : n) : 0;
}

/** API period markers, not a claim about upstream report publication time. */
export function reportPeriod(source: "daily" | "weekly" | "yearly", now: number): ReportPeriod {
  const date = new Date(now + OFFSET);
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - OFFSET;
  if (source === "daily")
    return { key: shanghaiDay(now), startTime: midnight, endTime: midnight + DAY };
  if (source === "yearly") {
    const year = date.getUTCFullYear() - 1;
    return {
      key: String(year),
      startTime: Date.UTC(year, 0, 1) - OFFSET,
      endTime: Date.UTC(year, 11, 31) - OFFSET,
    };
  }
  const endTime = midnight - ((date.getUTCDay() + 1) % 7) * DAY;
  return { key: shanghaiDay(endTime), startTime: endTime - 7 * DAY, endTime };
}

export function parseReport(
  source: NotificationSource,
  value: unknown,
  period: ReportPeriod,
  locale: NotificationLocale,
  now: number,
): InboxNotification | null {
  const root = object(value);
  if (root.code !== 200) throw new Error("report-unavailable");
  const data = object(root.data);
  const copy = notificationCopy(locale);
  let details: string[] = [];
  let body = copy.ready;
  if (source === "daily") {
    if (!Array.isArray(data.songDTOs)) return null;
    const songs = data.songDTOs
      .map(object)
      .filter(
        (song) =>
          song.songId &&
          typeof song.songName === "string" &&
          timestamp(song.lastPlayTime) >= period.startTime &&
          timestamp(song.lastPlayTime) <= now &&
          timestamp(song.lastPlayTime) < period.endTime,
      );
    if (!songs.length) return null;
    details = songs.slice(0, 20).map((song) => String(song.songName));
    body = `${period.key} · ${copy.until} ${new Date(now).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} · ${songs.length} ${copy.count}`;
  } else {
    const expectedType = source === "weekly" ? "week" : "year";
    // Never substitute request parameters or display defaults for response evidence.
    const start = timestamp(data.startTime);
    const validStart =
      source === "weekly"
        ? start >= period.endTime - 8 * DAY && start <= period.endTime - 5 * DAY
        : start === period.startTime;
    if (data.type !== expectedType || timestamp(data.endTime) !== period.endTime || !validStart)
      return null;
    const listen = object(data.listenTimeBlock);
    const wallpaper = object(data.wallpaperBlock);
    const song = object(data.topSongBlock);
    const artist = object(data.topArtistBlock);
    const positiveDuration =
      Number.isFinite(Number(listen.playDuration)) && Number(listen.playDuration) > 0;
    const positiveSongs =
      Number.isFinite(Number(wallpaper.songCount)) && Number(wallpaper.songCount) > 0;
    const namedSong = typeof song.songName === "string" && song.songName.trim().length > 0;
    const namedArtist =
      typeof artist.artistName === "string" && artist.artistName.trim().length > 0;
    if (!positiveDuration && !positiveSongs && !namedSong && !namedArtist) return null;
    details = [
      positiveDuration && typeof listen.playDurationText === "string"
        ? listen.playDurationText
        : "",
      positiveSongs ? `${wallpaper.songCount} ${copy.count}` : "",
      typeof song.songName === "string" ? song.songName : "",
      typeof artist.artistName === "string" ? artist.artistName : "",
    ].filter(Boolean);
    body = `${period.key} · ${details.join(" · ") || copy.ready}`;
  }
  return {
    id: `report:${source}:${period.key}`,
    source,
    category: "reports",
    title: notificationTitle(source, locale),
    body,
    details,
    periodKey: period.key,
    occurredAt: now,
    readAt: null,
  };
}
