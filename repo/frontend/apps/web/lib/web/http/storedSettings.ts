import {
  neteaseConfigOverrideSchema,
  networkConfigOverrideSchema,
  upgradeLegacyWebConfig,
  type BackendAddress,
  type BackendPlatform,
  type WebConfig,
} from "@/types/settings/config";

import { normalizeBackendConfig } from "../backendUrl";
import { webConfig } from "../env";

/** Request settings saved in Settings: `{ backend: { netease, qq }, network, netease }`. */
export const WEB_REQUEST_SETTINGS_KEY = "scopify-web-request-settings";

/** Keys used before the settings were split by platform, keyed by their old config section. */
export const LEGACY_WEB_SETTINGS_KEYS = {
  backend: "momo-web-backend-settings",
  qqBackend: "momo-web-qq-backend-settings",
  network: "momo-web-network-settings",
} as const;

type SettingsStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    // Malformed local cache falls back to defaults.
    return null;
  }
}

/**
 * Moves settings saved under the legacy flat keys into {@link WEB_REQUEST_SETTINGS_KEY}: the old
 * backend address becomes NetEase's, the old QQ address QQ's, and `randomCNIP` leaves the shared
 * network options for NetEase's. Runs only while the new key is absent, and drops the legacy keys
 * only after the new value is written, so a failed write never loses a saved address.
 */
export function migrateLegacyRequestSettings(storage: SettingsStorage): void {
  if (storage.getItem(WEB_REQUEST_SETTINGS_KEY) !== null) return;

  const legacy: Record<string, unknown> = {};
  for (const [section, key] of Object.entries(LEGACY_WEB_SETTINGS_KEYS)) {
    const value = parseStoredObject(storage.getItem(key));
    if (value) legacy[section] = value;
  }
  if (Object.keys(legacy).length === 0) return;

  storage.setItem(WEB_REQUEST_SETTINGS_KEY, JSON.stringify(upgradeLegacyWebConfig(legacy)));
  for (const key of Object.values(LEGACY_WEB_SETTINGS_KEYS)) storage.removeItem(key);
}

let hasMigrated = false;

function readStoredSettings(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    if (!hasMigrated) {
      hasMigrated = true;
      migrateLegacyRequestSettings(localStorage);
    }
    return parseStoredObject(localStorage.getItem(WEB_REQUEST_SETTINGS_KEY));
  } catch {
    // Storage can be unavailable (private mode, blocked site data); defaults apply.
    return null;
  }
}

function readSection(section: string): Record<string, unknown> | null {
  const value = readStoredSettings()?.[section];
  return isRecord(value) ? value : null;
}

/** The platform's API address saved in Settings, or `null` when nothing valid is stored. */
export function loadStoredBackendAddress(platform: BackendPlatform): BackendAddress | null {
  const parsed = readSection("backend")?.[platform];
  if (!isRecord(parsed)) return null;

  const defaults = webConfig.backend[platform];
  const port =
    typeof parsed.port === "number" || typeof parsed.port === "string"
      ? Number(parsed.port)
      : Number.NaN;
  if (typeof parsed.host !== "string" || !Number.isFinite(port)) return null;

  const protocol =
    parsed.protocol === "https" || parsed.protocol === "http" ? parsed.protocol : defaults.protocol;
  const resolved = normalizeBackendConfig({ ...defaults, host: parsed.host, port, protocol });
  return resolved.ok ? resolved.backend : null;
}

/** Shared network fields saved in Settings; invalid fields are dropped. */
export function loadStoredNetworkConfig(): Partial<WebConfig["network"]> {
  const parsed = readSection("network");
  return parsed ? (networkConfigOverrideSchema.safeParse(parsed).data ?? {}) : {};
}

/** NetEase-only request fields saved in Settings; invalid fields are dropped. */
export function loadStoredNeteaseConfig(): Partial<WebConfig["netease"]> {
  const parsed = readSection("netease");
  return parsed ? (neteaseConfigOverrideSchema.safeParse(parsed).data ?? {}) : {};
}

/** Saves the request settings; the locale is kept by the i18n store instead. */
export function saveStoredRequestSettings(config: WebConfig): void {
  const { backend, netease, network } = config;
  localStorage.setItem(WEB_REQUEST_SETTINGS_KEY, JSON.stringify({ backend, network, netease }));
}
