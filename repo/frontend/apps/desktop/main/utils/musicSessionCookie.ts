import type { MusicSessionCookie, MusicSessionSameSite } from "../../types/musicSession.js";

const COOKIE_ATTRIBUTES = new Set([
  "domain",
  "expires",
  "httponly",
  "max-age",
  "partitioned",
  "path",
  "priority",
  "samesite",
  "secure",
]);

/**
 * Parse both a request Cookie header and the aggregated Set-Cookie text returned by the NetEase
 * login endpoints. Attribute segments belong to the preceding cookie; every other name/value pair
 * starts a new cookie, including bundles that use a single semicolon between records.
 */
export function parseMusicSessionCookieBundle(value: string): MusicSessionCookie[] {
  const cookies: MusicSessionCookie[] = [];
  let current: MusicSessionCookie | null = null;

  for (const rawSegment of value.split(";")) {
    const segment = rawSegment.trim();
    if (!segment) continue;
    const separator = segment.indexOf("=");
    const rawName = separator === -1 ? segment : segment.slice(0, separator).trim();
    const attributeName = rawName.toLowerCase();

    if (COOKIE_ATTRIBUTES.has(attributeName)) {
      if (current) applyCookieAttribute(current, attributeName, segment, separator);
      continue;
    }
    if (separator <= 0) continue;

    current = {
      httpOnly: false,
      name: rawName,
      path: "/",
      value: segment.slice(separator + 1).trim(),
    };
    cookies.push(current);
  }

  return cookies;
}

/** Build the Cookie header a browser would send for one request path. */
export function createSessionCookieHeader(
  cookies: readonly MusicSessionCookie[],
  requestPath: string,
  nowMs = Date.now(),
) {
  return cookies
    .filter((cookie) => isCookieActive(cookie, requestPath, nowMs))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

function applyCookieAttribute(
  cookie: MusicSessionCookie,
  name: string,
  segment: string,
  separator: number,
) {
  const attributeValue = separator === -1 ? "" : segment.slice(separator + 1).trim();
  if (name === "httponly") cookie.httpOnly = true;
  else if (name === "secure") cookie.secure = true;
  else if (name === "path") cookie.path = attributeValue || "/";
  else if (name === "max-age") {
    const maxAge = Number(attributeValue);
    if (Number.isFinite(maxAge)) cookie.maxAge = maxAge;
  } else if (name === "expires") {
    const expiresAt = Date.parse(attributeValue);
    if (Number.isFinite(expiresAt)) cookie.expiresAt = expiresAt;
  } else if (name === "samesite") {
    cookie.sameSite = normalizeSameSite(attributeValue);
  }
}

function normalizeSameSite(value: string): MusicSessionSameSite {
  const normalized = value.toLowerCase();
  if (normalized === "lax" || normalized === "strict") return normalized;
  if (normalized === "none") return "no_restriction";
  return "unspecified";
}

function isCookieActive(cookie: MusicSessionCookie, requestPath: string, nowMs: number) {
  if (!cookie.value || cookie.maxAge === 0) return false;
  if (cookie.expiresAt !== undefined && cookie.expiresAt <= nowMs) return false;
  if (requestPath === cookie.path) return true;
  const prefix = cookie.path.endsWith("/") ? cookie.path : `${cookie.path}/`;
  return requestPath.startsWith(prefix);
}
