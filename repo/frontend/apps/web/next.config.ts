import type { NextConfig } from "next";

import { DEFAULT_WEB_CONFIG } from "./types/config";

function envNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseBackendPublicUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const protocol = url.protocol === "https:" ? "https" : "http";
    return {
      host: url.hostname,
      port: envNumber(url.port, protocol === "https" ? 443 : 80),
      protocol,
    } as const;
  } catch {
    return null;
  }
}

const backendPublicUrl = parseBackendPublicUrl(process.env.BACKEND_PUBLIC_URL);
const backendHost =
  process.env.APP_CFG_BACKEND_HOST ||
  backendPublicUrl?.host ||
  process.env.BACKEND_PUBLIC_HOST ||
  DEFAULT_WEB_CONFIG.backend.host;
const backendPort = envNumber(
  process.env.APP_CFG_BACKEND_PORT ||
    (backendPublicUrl ? String(backendPublicUrl.port) : undefined) ||
    process.env.BACKEND_PUBLIC_PORT ||
    process.env.BACKEND_PORT,
  DEFAULT_WEB_CONFIG.backend.port,
);
const configuredBackendProtocol = process.env.APP_CFG_BACKEND_PROTOCOL;
const backendProtocol =
  configuredBackendProtocol === "http" || configuredBackendProtocol === "https"
    ? configuredBackendProtocol
    : backendPublicUrl?.protocol ||
      (process.env.BACKEND_PUBLIC_PROTOCOL === "https"
        ? "https"
        : DEFAULT_WEB_CONFIG.backend.protocol);
const frontendDevPort = envNumber(
  process.env.APP_CFG_FRONTEND_DEV_PORT || process.env.FRONTEND_PORT,
  3000,
);
const debugLogRelayPort = envNumber(process.env.APP_CFG_DEBUG_LOG_RELAY_PORT, frontendDevPort + 1);
const isDesktopBuild = process.env.SCOPIFY_BUILD_TARGET === "desktop";
const nextDistDir =
  process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === "development" ? ".next-dev" : ".next");

export function shouldUseUnoptimizedImages(
  buildTarget = process.env.SCOPIFY_BUILD_TARGET,
  nodeEnv = process.env.NODE_ENV,
) {
  return buildTarget === "desktop" || nodeEnv === "development";
}

export const WEB_IMAGE_REMOTE_PATTERNS = [
  { protocol: "http", hostname: "**.music.126.net" },
  { protocol: "https", hostname: "**.music.126.net" },
  { protocol: "https", hostname: "api.qrserver.com" },
  { protocol: "https", hostname: "avatars.githubusercontent.com" },
  { protocol: "https", hostname: "cdn.jsdelivr.net" },
  { protocol: "https", hostname: "cdn-icons-png.flaticon.com" },
  { protocol: "https", hostname: "cdnb.artstation.com" },
  { protocol: "https", hostname: "images.steamusercontent.com" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "miqh.gallerycdn.vsassets.io" },
  { protocol: "https", hostname: "picsum.photos" },
  { protocol: "https", hostname: "upload.wikimedia.org" },
] satisfies NonNullable<NextConfig["images"]>["remotePatterns"];

const nextConfig: NextConfig = {
  transpilePackages: ["@scopify/desktop-contract"],
  images: {
    remotePatterns: WEB_IMAGE_REMOTE_PATTERNS,
    unoptimized: shouldUseUnoptimizedImages(),
  },
  ...(isDesktopBuild
    ? {
        output: "export",
        distDir: process.env.NEXT_DIST_DIR || "out",
        trailingSlash: true,
      }
    : { distDir: nextDistDir }),
  serverExternalPackages: [],
  env: {
    APP_CFG_APP_LOCALE: process.env.APP_CFG_APP_LOCALE || DEFAULT_WEB_CONFIG.app.locale,
    APP_CFG_BACKEND_HOST: backendHost,
    APP_CFG_BACKEND_PORT: String(backendPort),
    APP_CFG_BACKEND_PROTOCOL: backendProtocol,
    APP_CFG_FRONTEND_DEV_PORT: String(frontendDevPort),
    APP_CFG_NET_TIMEOUT:
      process.env.APP_CFG_NET_TIMEOUT || String(DEFAULT_WEB_CONFIG.network.timeout),
    APP_CFG_NET_RANDOM_CNIP:
      process.env.APP_CFG_NET_RANDOM_CNIP || String(DEFAULT_WEB_CONFIG.network.randomCNIP),
    APP_CFG_DEBUG_LOG_RELAY_PORT: String(debugLogRelayPort),
  },
  allowedDevOrigins: ["192.168.3.8", "localhost", "127.0.0.1", "_next"],
};

export default nextConfig;
