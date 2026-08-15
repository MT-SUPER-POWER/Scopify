import type { BackendProtocol, WebConfig } from "@/types/config";

export type BackendConfigResolution =
  { backend: WebConfig["backend"]; ok: true; url: string } | { message: string; ok: false };

export type BackendBaseUrlResolution = { ok: true; url: string } | { message: string; ok: false };

export interface CleanedBackendHost {
  host: string;
  port?: number;
  protocol?: BackendProtocol;
}

const DEFAULT_PORTS: Record<BackendProtocol, number> = {
  http: 80,
  https: 443,
};
const EXPLICIT_PROTOCOL_PATTERN = /^([a-z][a-z\d+.-]*):\/\//i;

function isValidPort(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 65535;
}

function formatHostname(hostname: string) {
  return hostname.includes(":") && !hostname.startsWith("[") ? `[${hostname}]` : hostname;
}

/**
 * Parses user input in the host field, automatically stripping redundant
 * protocol schemes (http/https), port numbers, or trailing slashes.
 */
export function cleanBackendHostInput(raw: string): CleanedBackendHost {
  const trimmed = raw.trim();
  if (!trimmed) return { host: "" };

  const schemeMatch = trimmed.match(EXPLICIT_PROTOCOL_PATTERN);
  let extractedProtocol: BackendProtocol | undefined;
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme === "http" || scheme === "https") {
      extractedProtocol = scheme;
    }
  }

  const urlCandidate = schemeMatch
    ? trimmed
    : `http://${trimmed.startsWith("//") ? trimmed.slice(2) : trimmed}`;

  try {
    const parsed = new URL(urlCandidate);
    const host = parsed.hostname;
    let extractedPort: number | undefined;
    if (parsed.port) {
      const p = Number(parsed.port);
      if (isValidPort(p)) {
        extractedPort = p;
      }
    } else if (schemeMatch) {
      extractedPort = extractedProtocol === "https" ? 443 : 80;
    }
    return {
      host,
      ...(extractedPort !== undefined ? { port: extractedPort } : {}),
      ...(extractedProtocol ? { protocol: extractedProtocol } : {}),
    };
  } catch {
    const stripped = trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^\/\//, "")
      .replace(/\/.*$/, "")
      .trim();
    return { host: stripped };
  }
}

/**
 * Normalizes backend config into a canonical protocol, host, and port tuple.
 */
export function normalizeBackendConfig(backend: WebConfig["backend"]): BackendConfigResolution {
  const cleaned = cleanBackendHostInput(backend.host);
  const host = cleaned.host;
  if (!host) return { message: "Backend host cannot be empty.", ok: false };

  const protocol: BackendProtocol =
    cleaned.protocol || (backend.protocol === "https" ? "https" : "http");

  const port = cleaned.port ?? backend.port;
  if (!isValidPort(port)) {
    return { message: "Backend port must be an integer between 1 and 65535.", ok: false };
  }

  const url = `${protocol}://${formatHostname(host)}${
    port === DEFAULT_PORTS[protocol] ? "" : `:${port}`
  }`;

  return {
    backend: { host, port, protocol },
    ok: true,
    url,
  };
}

export function resolveBackendBaseUrl(backend: WebConfig["backend"]): BackendBaseUrlResolution {
  const resolved = normalizeBackendConfig(backend);
  return resolved.ok ? { ok: true, url: resolved.url } : resolved;
}

export function buildBackendBaseUrl(backend: WebConfig["backend"]): string {
  const resolved = resolveBackendBaseUrl(backend);
  if (resolved.ok) return resolved.url;

  return `${backend.protocol}://${backend.host.trim()}:${backend.port}`;
}
