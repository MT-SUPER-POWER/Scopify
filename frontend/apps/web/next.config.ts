import type { NextConfig } from "next";

import { DEFAULT_WEB_CONFIG } from "./types/config";

function envNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const backendHost =
  process.env.APP_CFG_BACKEND_HOST ||
  process.env.BACKEND_PUBLIC_HOST ||
  DEFAULT_WEB_CONFIG.backend.host;
const backendPort = envNumber(
  process.env.APP_CFG_BACKEND_PORT || process.env.BACKEND_PUBLIC_PORT || process.env.BACKEND_PORT,
  DEFAULT_WEB_CONFIG.backend.port,
);
const frontendDevPort = envNumber(
  process.env.APP_CFG_FRONTEND_DEV_PORT || process.env.FRONTEND_PORT,
  3000,
);
const debugLogRelayPort = envNumber(process.env.APP_CFG_DEBUG_LOG_RELAY_PORT, frontendDevPort + 1);
const isDesktopBuild = process.env.SCOPIFY_BUILD_TARGET === "desktop";

const nextConfig: NextConfig = {
  transpilePackages: ["@scopify/desktop-contract"],
  ...(isDesktopBuild
    ? {
        output: "export",
        distDir: process.env.NEXT_DIST_DIR || "out",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  serverExternalPackages: [],
  env: {
    APP_CFG_APP_LOCALE: process.env.APP_CFG_APP_LOCALE || DEFAULT_WEB_CONFIG.app.locale,
    APP_CFG_BACKEND_HOST: backendHost,
    APP_CFG_BACKEND_PORT: String(backendPort),
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
