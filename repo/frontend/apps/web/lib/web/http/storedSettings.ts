import {
  networkConfigOverrideSchema,
  type BackendAddressKey,
  type WebConfig,
} from "@/types/settings/config";

import { normalizeBackendConfig } from "../backendUrl";
import { webConfig } from "../env";

export const WEB_NETWORK_SETTINGS_KEY = "momo-web-network-settings";
export const WEB_BACKEND_SETTINGS_KEY = "momo-web-backend-settings";
export const WEB_QQ_BACKEND_SETTINGS_KEY = "momo-web-qq-backend-settings";

export const BACKEND_STORAGE_KEYS: Record<BackendAddressKey, string> = {
  backend: WEB_BACKEND_SETTINGS_KEY,
  qqBackend: WEB_QQ_BACKEND_SETTINGS_KEY,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStoredObject(key: string): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    // Malformed local cache falls back to defaults.
    return null;
  }
}

/** The backend address saved in Settings, or `null` when nothing valid is stored. */
export function loadStoredBackendAddress(target: BackendAddressKey): WebConfig["backend"] | null {
  const parsed = readStoredObject(BACKEND_STORAGE_KEYS[target]);
  if (!parsed) return null;

  const defaults = webConfig[target];
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

/** Network fields saved in Settings; invalid fields are dropped. */
export function loadStoredNetworkConfig(): Partial<WebConfig["network"]> {
  const parsed = readStoredObject(WEB_NETWORK_SETTINGS_KEY);
  return parsed ? (networkConfigOverrideSchema.safeParse(parsed).data ?? {}) : {};
}
