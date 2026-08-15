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
const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isValidPort(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 65535;
}

function formatHostname(hostname: string) {
  return hostname.includes(":") && !hostname.startsWith("[") ? `[${hostname}]` : hostname;
}

/**
 * Validates whether a pure host string (without protocol, port, or path)
 * is a valid IPv4, IPv6, localhost, or domain name.
 */
export function isValidBackendHost(host: string): boolean {
  const trimmed = host.trim();
  if (!trimmed) return false;

  // 1. IPv4 check
  const ipv4Match = trimmed.match(IPV4_PATTERN);
  if (ipv4Match) {
    const parts = [ipv4Match[1], ipv4Match[2], ipv4Match[3], ipv4Match[4]].map(Number);
    return parts.every((num) => num >= 0 && num <= 255);
  }

  // 2. IPv6 check
  const isBracketedIpv6 = trimmed.startsWith("[") && trimmed.endsWith("]");
  const rawIpv6 = isBracketedIpv6 ? trimmed.slice(1, -1) : trimmed;
  if (rawIpv6.includes(":")) {
    // Standard IPv6 pattern check
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv6Regex.test(rawIpv6);
  }

  // 3. Localhost check
  if (trimmed.toLowerCase() === "localhost") return true;

  // 4. Domain name / Hostname check
  if (trimmed.length > 253) return false;
  if (trimmed.startsWith(".") || trimmed.endsWith(".") || trimmed.includes("..")) return false;

  const labels = trimmed.split(".");
  // Single-label hostname (e.g., local server name "my-nas")
  if (labels.length === 1) {
    const label = labels[0];
    if (/^\d+$/.test(label)) return false; // Pure number is not a valid hostname
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label);
  }

  // Multi-label domain name (e.g., "api.example.com")
  return labels.every((label, index) => {
    if (label.length === 0 || label.length > 63) return false;
    if (index === labels.length - 1 && /^\d+$/.test(label)) return false; // TLD cannot be pure numbers
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label);
  });
}

/**
 * Parses user input in the host field, cleanly stripping protocol schemes (http/https),
 * port numbers, or trailing slashes WITHOUT using WHATWG URL number parsing side effects.
 */
export function cleanBackendHostInput(raw: string): CleanedBackendHost {
  let trimmed = raw.trim();
  if (!trimmed) return { host: "" };

  // 1. Extract protocol if present
  let extractedProtocol: BackendProtocol | undefined;
  const schemeMatch = trimmed.match(EXPLICIT_PROTOCOL_PATTERN);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme === "http" || scheme === "https") {
      extractedProtocol = scheme;
    }
    trimmed = trimmed.slice(schemeMatch[0].length);
  } else if (trimmed.startsWith("//")) {
    trimmed = trimmed.slice(2);
  }

  // 2. Strip trailing path / query / hash
  const slashIndex = trimmed.search(/[/?#]/);
  if (slashIndex !== -1) {
    trimmed = trimmed.slice(0, slashIndex);
  }

  // 3. Extract port
  let extractedPort: number | undefined;
  let host = trimmed;

  if (trimmed.startsWith("[")) {
    // IPv6 format [ipv6]:port or [ipv6]
    const closeBracket = trimmed.indexOf("]");
    if (closeBracket !== -1) {
      host = trimmed.slice(0, closeBracket + 1);
      const afterBracket = trimmed.slice(closeBracket + 1);
      if (afterBracket.startsWith(":")) {
        const portCandidate = afterBracket.slice(1);
        if (/^\d+$/.test(portCandidate)) {
          const p = Number(portCandidate);
          if (isValidPort(p)) {
            extractedPort = p;
          }
        }
      }
    }
  } else {
    // Regular host:port format
    const colonIndex = trimmed.lastIndexOf(":");
    if (colonIndex !== -1) {
      const portCandidate = trimmed.slice(colonIndex + 1);
      if (/^\d+$/.test(portCandidate)) {
        const p = Number(portCandidate);
        if (isValidPort(p)) {
          extractedPort = p;
          host = trimmed.slice(0, colonIndex);
        }
      }
    }
  }

  return {
    host,
    ...(extractedPort !== undefined ? { port: extractedPort } : {}),
    ...(extractedProtocol ? { protocol: extractedProtocol } : {}),
  };
}

/**
 * Validates a user-entered host string (which might include scheme, port, or path).
 */
export function isBackendHostInputValid(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  // Check for disallowed protocols (e.g. ftp://)
  const schemeMatch = trimmed.match(EXPLICIT_PROTOCOL_PATTERN);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== "http" && scheme !== "https") {
      return false;
    }
  }

  const cleaned = cleanBackendHostInput(trimmed);
  if (!cleaned.host) return false;

  return isValidBackendHost(cleaned.host);
}

/**
 * Normalizes backend config into a canonical protocol, host, and port tuple.
 */
export function normalizeBackendConfig(backend: WebConfig["backend"]): BackendConfigResolution {
  const cleaned = cleanBackendHostInput(backend.host);
  const host = cleaned.host;
  if (!host) return { message: "Backend host cannot be empty.", ok: false };
  if (!isValidBackendHost(host)) {
    return { message: "Backend host format is invalid.", ok: false };
  }

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
