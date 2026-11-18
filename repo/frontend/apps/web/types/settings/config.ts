import { z } from "zod";

export const APP_LOCALES = ["zh-CN", "zh-TW", "en-US"] as const;
export const BACKEND_PROTOCOLS = ["http", "https"] as const;
export const DEFAULT_WEB_CONFIG = {
  app: {
    locale: "zh-CN",
  },
  /** One API address per platform, used when no Desktop-managed API is running. */
  backend: {
    netease: {
      host: "127.0.0.1",
      port: 3838,
      protocol: "http",
    },
    qq: {
      host: "127.0.0.1",
      port: 3200,
      protocol: "http",
    },
  },
  /** Request options shared by every platform. */
  network: {
    timeout: 10000,
  },
  /** Request options only the NetEase API understands. */
  netease: {
    randomCNIP: "false",
  },
} as const;

const appLocaleSchema = z.enum(APP_LOCALES);
const backendProtocolSchema = z.enum(BACKEND_PROTOCOLS);

function toRecord(value: unknown): Record<string, unknown> {
  return z.record(z.unknown()).safeParse(value).data ?? {};
}

function positiveNumber(defaultValue: number) {
  return z.preprocess((value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
  }, z.number().default(defaultValue));
}

function trimmedString(defaultValue: string) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  }, z.string().default(defaultValue));
}

function optionalPositiveNumber() {
  return z.preprocess((value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
  }, z.number().optional());
}

const randomCNIPSchema = z.preprocess(
  (value) => (value === true || value === "true" ? "true" : "false"),
  z.enum(["true", "false"]),
);

export const networkConfigOverrideSchema = z.object({ timeout: optionalPositiveNumber() }).strip();

export const neteaseConfigOverrideSchema = z
  .object({ randomCNIP: randomCNIPSchema.optional() })
  .strip();

function backendAddressSchema(defaults: (typeof DEFAULT_WEB_CONFIG.backend)[BackendPlatform]) {
  return z.preprocess(
    toRecord,
    z.object({
      host: trimmedString(defaults.host),
      port: positiveNumber(defaults.port),
      protocol: backendProtocolSchema.catch(defaults.protocol),
    }),
  );
}

/**
 * Lifts the flat shape used before addresses were split by platform (`backend` holding the
 * NetEase address, `qqBackend`, `network.randomCNIP`) into the per-platform shape. A value
 * already in the new shape passes through unchanged; only fields that are present are moved,
 * so missing ones still fall back to defaults.
 */
export function upgradeLegacyWebConfig(value: unknown): Record<string, unknown> {
  const record = toRecord(value);
  const { qqBackend, ...rest } = record;
  const backend = toRecord(record.backend);
  const network = toRecord(record.network);
  const isFlatBackend = "host" in backend || "port" in backend || "protocol" in backend;
  if (!isFlatBackend && qqBackend === undefined && !("randomCNIP" in network)) return record;

  const { randomCNIP, ...sharedNetwork } = network;
  const nextBackend: Record<string, unknown> = isFlatBackend
    ? { netease: backend }
    : { ...backend };
  if (qqBackend !== undefined && nextBackend.qq === undefined) nextBackend.qq = qqBackend;

  return {
    ...rest,
    ...(record.backend === undefined && qqBackend === undefined ? {} : { backend: nextBackend }),
    ...(record.network === undefined ? {} : { network: sharedNetwork }),
    ...(randomCNIP === undefined ? {} : { netease: { ...toRecord(record.netease), randomCNIP } }),
  };
}

export const webConfigSchema = z.preprocess(
  upgradeLegacyWebConfig,
  z
    .object({
      app: z.preprocess(
        toRecord,
        z.object({ locale: appLocaleSchema.catch(DEFAULT_WEB_CONFIG.app.locale) }),
      ),
      backend: z.preprocess(
        toRecord,
        z.object({
          netease: backendAddressSchema(DEFAULT_WEB_CONFIG.backend.netease),
          qq: backendAddressSchema(DEFAULT_WEB_CONFIG.backend.qq),
        }),
      ),
      network: z.preprocess(
        toRecord,
        z.object({ timeout: positiveNumber(DEFAULT_WEB_CONFIG.network.timeout) }),
      ),
      netease: z.preprocess(toRecord, z.object({ randomCNIP: randomCNIPSchema })),
    })
    .strip(),
);

export type AppLocale = z.output<typeof appLocaleSchema>;
export type BackendProtocol = z.output<typeof backendProtocolSchema>;
export type WebConfig = z.output<typeof webConfigSchema>;

/** A platform whose API address the web config holds. */
export type BackendPlatform = "netease" | "qq";

/** One platform's API address. */
export type BackendAddress = WebConfig["backend"][BackendPlatform];
