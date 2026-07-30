import { z } from "zod";

/**
 * 应用全局配置类型定义
 */
export const APP_LOCALES = ["zh-CN", "zh-TW", "en-US"] as const;
export const ELECTRON_PROXY_MODES = ["system", "direct", "custom"] as const;
export const DEFAULT_APP_CONFIG = {
  app: {
    gpuAcceleration: true,
    devTools: false,
    closeAction: 2,
    locale: "zh-CN",
  },
  backend: {
    port: 3838,
    host: "127.0.0.1",
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
    timeout: 5000,
    randomCNIP: "false",
    proxyMode: "system",
    proxyUrl: "",
  },
  cache: {
    enabled: true,
    dir: "",
    maxSizeMB: 256,
    pageTtlMinutes: 360,
    searchTtlMinutes: 30,
  },
  updater: {
    checkOnStartup: true,
    autoDownload: false,
  },
} as const;

const appLocaleSchema = z.enum(APP_LOCALES);
const electronProxyModeSchema = z.enum(ELECTRON_PROXY_MODES);
const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);

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

function optionalPositiveNumber() {
  return z.preprocess((value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
  }, z.number().optional());
}

function optionalTrimmedString(allowEmpty = false) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return allowEmpty || trimmed ? trimmed : undefined;
  }, z.string().optional());
}

const appSectionConfigSchema = z.preprocess(
  toRecord,
  z.object({
    gpuAcceleration: normalizedBoolean(DEFAULT_APP_CONFIG.app.gpuAcceleration),
    devTools: normalizedBoolean(DEFAULT_APP_CONFIG.app.devTools),
    closeAction: z
      .union([z.literal(0), z.literal(1), z.literal(2)])
      .catch(DEFAULT_APP_CONFIG.app.closeAction),
    locale: appLocaleSchema.catch(DEFAULT_APP_CONFIG.app.locale),
  }),
);

const backendConfigSchema = z.preprocess(
  toRecord,
  z.object({
    host: trimmedString(DEFAULT_APP_CONFIG.backend.host),
    port: positiveNumber(DEFAULT_APP_CONFIG.backend.port),
  }),
);

const frontendConfigSchema = z.preprocess(
  toRecord,
  z.object({
    devPort: positiveNumber(DEFAULT_APP_CONFIG.frontend.devPort),
    host: trimmedString(DEFAULT_APP_CONFIG.frontend.host),
  }),
);

const loggingConfigSchema = z.preprocess(
  toRecord,
  z.object({
    level: logLevelSchema.catch(DEFAULT_APP_CONFIG.logging.level),
    format: trimmedString(DEFAULT_APP_CONFIG.logging.format, true),
    keepDays: positiveNumber(DEFAULT_APP_CONFIG.logging.keepDays),
  }),
);

const randomCNIPSchema = z.preprocess(
  (value) => (value === true || value === "true" ? "true" : "false"),
  z.enum(["true", "false"]),
);

export const networkConfigOverrideSchema = z
  .object({
    timeout: optionalPositiveNumber(),
    randomCNIP: randomCNIPSchema.optional(),
    proxyMode: electronProxyModeSchema.optional().catch(undefined),
    proxyUrl: optionalTrimmedString(true),
  })
  .strip();

const networkConfigSchema = z.preprocess(
  toRecord,
  z.object({
    timeout: positiveNumber(DEFAULT_APP_CONFIG.network.timeout),
    randomCNIP: randomCNIPSchema,
    proxyMode: electronProxyModeSchema.catch(DEFAULT_APP_CONFIG.network.proxyMode),
    proxyUrl: trimmedString(DEFAULT_APP_CONFIG.network.proxyUrl, true),
  }),
);

const cacheConfigSchema = z.preprocess(
  toRecord,
  z.object({
    enabled: normalizedBoolean(DEFAULT_APP_CONFIG.cache.enabled),
    dir: trimmedString(DEFAULT_APP_CONFIG.cache.dir, true),
    maxSizeMB: positiveNumber(DEFAULT_APP_CONFIG.cache.maxSizeMB),
    pageTtlMinutes: positiveNumber(DEFAULT_APP_CONFIG.cache.pageTtlMinutes),
    searchTtlMinutes: positiveNumber(DEFAULT_APP_CONFIG.cache.searchTtlMinutes),
  }),
);

const updaterConfigSchema = z.preprocess(
  toRecord,
  z.object({
    checkOnStartup: normalizedBoolean(DEFAULT_APP_CONFIG.updater.checkOnStartup),
    autoDownload: normalizedBoolean(DEFAULT_APP_CONFIG.updater.autoDownload),
  }),
);

export const appConfigSchema = z.preprocess(
  toRecord,
  z
    .object({
      app: appSectionConfigSchema,
      backend: backendConfigSchema,
      frontend: frontendConfigSchema,
      logging: loggingConfigSchema,
      network: networkConfigSchema,
      cache: cacheConfigSchema,
      updater: updaterConfigSchema,
    })
    .strip(),
);

export type AppConfig = z.output<typeof appConfigSchema>;
export type AppLocale = z.output<typeof appLocaleSchema>;
export type ElectronProxyMode = z.output<typeof electronProxyModeSchema>;

export function isAppLocale(value: unknown): value is AppLocale {
  return appLocaleSchema.safeParse(value).success;
}

export function isElectronProxyMode(value: unknown): value is ElectronProxyMode {
  return electronProxyModeSchema.safeParse(value).success;
}

export function normalizeAppConfig(input?: unknown): AppConfig {
  return appConfigSchema.parse(input ?? {});
}
