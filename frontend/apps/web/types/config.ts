import { z } from "zod";

export const APP_LOCALES = ["zh-CN", "zh-TW", "en-US"] as const;
export const BACKEND_PROTOCOLS = ["http", "https"] as const;
export const DEFAULT_WEB_CONFIG = {
  app: {
    locale: "zh-CN",
  },
  backend: {
    host: "127.0.0.1",
    port: 3838,
    protocol: "http",
  },
  network: {
    randomCNIP: "false",
    timeout: 10000,
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

export const networkConfigOverrideSchema = z
  .object({
    timeout: optionalPositiveNumber(),
    randomCNIP: randomCNIPSchema.optional(),
  })
  .strip();

export const webConfigSchema = z.preprocess(
  toRecord,
  z
    .object({
      app: z.preprocess(
        toRecord,
        z.object({ locale: appLocaleSchema.catch(DEFAULT_WEB_CONFIG.app.locale) }),
      ),
      backend: z.preprocess(
        toRecord,
        z.object({
          host: trimmedString(DEFAULT_WEB_CONFIG.backend.host),
          port: positiveNumber(DEFAULT_WEB_CONFIG.backend.port),
          protocol: backendProtocolSchema.catch(DEFAULT_WEB_CONFIG.backend.protocol),
        }),
      ),
      network: z.preprocess(
        toRecord,
        z.object({
          randomCNIP: randomCNIPSchema,
          timeout: positiveNumber(DEFAULT_WEB_CONFIG.network.timeout),
        }),
      ),
    })
    .strip(),
);

export type AppLocale = z.output<typeof appLocaleSchema>;
export type BackendProtocol = z.output<typeof backendProtocolSchema>;
export type WebConfig = z.output<typeof webConfigSchema>;

export function isAppLocale(value: unknown): value is AppLocale {
  return appLocaleSchema.safeParse(value).success;
}

export function normalizeWebConfig(input?: unknown): WebConfig {
  return webConfigSchema.parse(input ?? {});
}
