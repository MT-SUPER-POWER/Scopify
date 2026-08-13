import { z } from "zod";
import type { DesktopHostConfig } from "@mt-super-power/desktop-contract";

export const ELECTRON_PROXY_MODES = ["system", "direct", "custom"] as const;
export const DEFAULT_DESKTOP_HOST_CONFIG = {
  app: {
    gpuAcceleration: true,
    devTools: false,
    closeAction: 2,
  },
  frontend: {
    devPort: 3000,
    host: "127.0.0.1",
  },
  logging: {
    level: "info",
    format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}",
    keepDays: 7,
  },
  network: {
    proxyMode: "system",
    proxyUrl: "",
  },
  cache: {
    dir: "",
    page: {
      enabled: true,
      maxSizeMB: 256,
      ttlMinutes: 360,
      searchTtlMinutes: 30,
    },
    playback: {
      enabled: true,
      maxSizeMB: 64,
      maxEntries: 100,
      urlTtlMinutes: 30,
      lyricTtlMinutes: 1440,
    },
  },
  discord: {
    enabled: true,
    applicationId: "1536959813114658836",
  },
  updater: {
    checkOnStartup: true,
    autoDownload: false,
  },
} as const satisfies DesktopHostConfig;

function toRecord(value: unknown): Record<string, unknown> {
  return z.record(z.unknown()).safeParse(value).data ?? {};
}

function normalizedBoolean(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
  }, z.boolean().default(defaultValue));
}

function positiveNumber(defaultValue: number) {
  return z.preprocess((value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
  }, z.number().default(defaultValue));
}

function trimmedString(defaultValue: string, allowEmpty = false) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return allowEmpty || trimmed ? trimmed : undefined;
  }, z.string().default(defaultValue));
}

function normalizeCacheConfig(value: unknown): Record<string, unknown> {
  const cache = toRecord(value);
  const page = toRecord(cache.page);
  const playback = toRecord(cache.playback);

  // Flat cache keys were used through v1. Keep reading them so existing YAML files
  // become the new scoped configuration on their next save.
  return {
    dir: cache.dir,
    page: {
      enabled: page.enabled ?? cache.enabled,
      maxSizeMB: page.maxSizeMB ?? cache.maxSizeMB,
      ttlMinutes: page.ttlMinutes ?? cache.pageTtlMinutes,
      searchTtlMinutes: page.searchTtlMinutes ?? cache.searchTtlMinutes,
    },
    playback: {
      enabled: playback.enabled ?? cache.enabled,
      maxSizeMB: playback.maxSizeMB,
      maxEntries: playback.maxEntries,
      urlTtlMinutes: playback.urlTtlMinutes,
      lyricTtlMinutes: playback.lyricTtlMinutes,
    },
  };
}

export const desktopHostConfigSchema = z.preprocess(
  toRecord,
  z
    .object({
      app: z.preprocess(
        toRecord,
        z.object({
          gpuAcceleration: normalizedBoolean(DEFAULT_DESKTOP_HOST_CONFIG.app.gpuAcceleration),
          devTools: normalizedBoolean(DEFAULT_DESKTOP_HOST_CONFIG.app.devTools),
          closeAction: z
            .union([z.literal(0), z.literal(1), z.literal(2)])
            .catch(DEFAULT_DESKTOP_HOST_CONFIG.app.closeAction),
        }),
      ),
      frontend: z.preprocess(
        toRecord,
        z.object({
          devPort: positiveNumber(DEFAULT_DESKTOP_HOST_CONFIG.frontend.devPort),
          host: trimmedString(DEFAULT_DESKTOP_HOST_CONFIG.frontend.host),
        }),
      ),
      logging: z.preprocess(
        toRecord,
        z.object({
          level: z
            .enum(["debug", "info", "warn", "error"])
            .catch(DEFAULT_DESKTOP_HOST_CONFIG.logging.level),
          format: trimmedString(DEFAULT_DESKTOP_HOST_CONFIG.logging.format, true),
          keepDays: positiveNumber(DEFAULT_DESKTOP_HOST_CONFIG.logging.keepDays),
        }),
      ),
      network: z.preprocess(
        toRecord,
        z.object({
          proxyMode: z
            .enum(ELECTRON_PROXY_MODES)
            .catch(DEFAULT_DESKTOP_HOST_CONFIG.network.proxyMode),
          proxyUrl: trimmedString(DEFAULT_DESKTOP_HOST_CONFIG.network.proxyUrl, true),
        }),
      ),
      cache: z.preprocess(
        normalizeCacheConfig,
        z.object({
          dir: trimmedString(DEFAULT_DESKTOP_HOST_CONFIG.cache.dir, true),
          page: z.preprocess(
            toRecord,
            z.object({
              enabled: normalizedBoolean(DEFAULT_DESKTOP_HOST_CONFIG.cache.page.enabled),
              maxSizeMB: positiveNumber(DEFAULT_DESKTOP_HOST_CONFIG.cache.page.maxSizeMB),
              ttlMinutes: positiveNumber(DEFAULT_DESKTOP_HOST_CONFIG.cache.page.ttlMinutes),
              searchTtlMinutes: positiveNumber(
                DEFAULT_DESKTOP_HOST_CONFIG.cache.page.searchTtlMinutes,
              ),
            }),
          ),
          playback: z.preprocess(
            toRecord,
            z.object({
              enabled: normalizedBoolean(DEFAULT_DESKTOP_HOST_CONFIG.cache.playback.enabled),
              maxSizeMB: positiveNumber(DEFAULT_DESKTOP_HOST_CONFIG.cache.playback.maxSizeMB),
              maxEntries: positiveNumber(DEFAULT_DESKTOP_HOST_CONFIG.cache.playback.maxEntries),
              urlTtlMinutes: positiveNumber(
                DEFAULT_DESKTOP_HOST_CONFIG.cache.playback.urlTtlMinutes,
              ),
              lyricTtlMinutes: positiveNumber(
                DEFAULT_DESKTOP_HOST_CONFIG.cache.playback.lyricTtlMinutes,
              ),
            }),
          ),
        }),
      ),
      discord: z.preprocess(
        toRecord,
        z.object({
          enabled: normalizedBoolean(DEFAULT_DESKTOP_HOST_CONFIG.discord.enabled),
          applicationId: trimmedString(DEFAULT_DESKTOP_HOST_CONFIG.discord.applicationId, true),
        }),
      ),
      updater: z.preprocess(
        toRecord,
        z.object({
          checkOnStartup: normalizedBoolean(DEFAULT_DESKTOP_HOST_CONFIG.updater.checkOnStartup),
          autoDownload: normalizedBoolean(DEFAULT_DESKTOP_HOST_CONFIG.updater.autoDownload),
        }),
      ),
    })
    .strip(),
);

export function normalizeDesktopHostConfig(input?: unknown): DesktopHostConfig {
  return desktopHostConfigSchema.parse(input ?? {});
}
