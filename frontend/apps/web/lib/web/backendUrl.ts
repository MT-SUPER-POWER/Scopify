import type { BackendProtocol, WebConfig } from "@/types/config";

export type BackendConfigResolution =
  { backend: WebConfig["backend"]; ok: true; url: string } | { message: string; ok: false };

export type BackendBaseUrlResolution = { ok: true; url: string } | { message: string; ok: false };

const DEFAULT_PORTS: Record<BackendProtocol, number> = {
  http: 80,
  https: 443,
};
const HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const EXPLICIT_PROTOCOL_PATTERN = /^([a-z][a-z\d+.-]*):\/\//i;

function isValidPort(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 65535;
}

function formatHostname(hostname: string) {
  return hostname.includes(":") && !hostname.startsWith("[") ? `[${hostname}]` : hostname;
}

function resolveConfiguredProtocol(value: unknown): BackendProtocol | null {
  return value === "http" || value === "https" ? value : null;
}

function addProtocol(protocol: BackendProtocol, host: string) {
  return `${protocol}://${host.startsWith("//") ? host.slice(2) : host}`;
}

/**
 * Accepts a hostname, a hostname with a port, or a complete HTTP(S) origin and
 * returns one canonical protocol/host/port tuple for storage and requests.
 */
export function normalizeBackendConfig(backend: WebConfig["backend"]): BackendConfigResolution {
  const rawHost = backend.host.trim();
  if (!rawHost) return { message: "Backend host cannot be empty.", ok: false };

  const schemeMatch = rawHost.match(EXPLICIT_PROTOCOL_PATTERN);
  const explicitScheme = schemeMatch?.[1].toLowerCase();
  if (explicitScheme && !HTTP_PROTOCOLS.has(`${explicitScheme}:`)) {
    return { message: "Backend URL must use HTTP or HTTPS.", ok: false };
  }

  const hasExplicitUrl = Boolean(explicitScheme);
  const configuredProtocol = resolveConfiguredProtocol(backend.protocol);
  if (!hasExplicitUrl && !configuredProtocol) {
    return { message: "Backend protocol must be HTTP or HTTPS.", ok: false };
  }

  let protocol = (explicitScheme || configuredProtocol) as BackendProtocol;
  const candidate = hasExplicitUrl ? rawHost : addProtocol(protocol, rawHost);

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { message: "Backend URL is not valid.", ok: false };
  }

  if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
    return { message: "Backend URL must use HTTP or HTTPS.", ok: false };
  }
  if (!parsed.hostname) return { message: "Backend URL must include a host.", ok: false };
  if (parsed.username || parsed.password) {
    return { message: "Backend URL cannot contain credentials.", ok: false };
  }
  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    return { message: "Backend URL must point to the API origin, without a path.", ok: false };
  }
  if (parsed.search || parsed.hash) {
    return { message: "Backend URL cannot contain a query or hash.", ok: false };
  }

  // A bare `api.example.com:443` is unambiguous, so use HTTPS even when the
  // previous setting was HTTP. Other bare hosts retain the configured scheme.
  if (!hasExplicitUrl && parsed.port === "443") {
    protocol = "https";
    parsed = new URL(addProtocol(protocol, rawHost));
  } else if (!hasExplicitUrl && parsed.port === "80") {
    protocol = "http";
    parsed = new URL(addProtocol(protocol, rawHost));
  } else if (!hasExplicitUrl && !parsed.port) {
    if (!isValidPort(backend.port)) {
      return { message: "Backend port must be an integer between 1 and 65535.", ok: false };
    }
    if (backend.port === 443) {
      protocol = "https";
      parsed = new URL(addProtocol(protocol, rawHost));
    } else if (backend.port === 80) {
      protocol = "http";
      parsed = new URL(addProtocol(protocol, rawHost));
    } else if (backend.port !== DEFAULT_PORTS[protocol]) {
      parsed.port = String(backend.port);
    }
  }

  const port = parsed.port ? Number(parsed.port) : DEFAULT_PORTS[protocol];
  if (!isValidPort(port)) {
    return { message: "Backend port must be an integer between 1 and 65535.", ok: false };
  }

  const host = parsed.hostname;
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

  // Keep a deterministic fallback for malformed legacy settings. Validation
  // surfaces the resolution error before a request is attempted.
  return `${backend.protocol}://${backend.host.trim()}:${backend.port}`;
}
