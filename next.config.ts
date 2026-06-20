import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import type { NextConfig } from "next";

import type { PartialAppConfig } from "./types/config";
import { normalizeAppConfig } from "./types/config";

const configPath = join(process.cwd(), "config", "app.config.yml");
const defaultPath = join(process.cwd(), "config", "app.config.default.yml");
const raw = readFileSync(existsSync(configPath) ? configPath : defaultPath, "utf-8");
const cfg = normalizeAppConfig(yaml.load(raw) as PartialAppConfig);

function envNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const backendHost =
  process.env.APP_CFG_BACKEND_HOST || process.env.BACKEND_PUBLIC_HOST || cfg.backend.host;
const backendPort = envNumber(
  process.env.APP_CFG_BACKEND_PORT || process.env.BACKEND_PUBLIC_PORT || process.env.BACKEND_PORT,
  cfg.backend.port,
);
const frontendDevPort = envNumber(
  process.env.APP_CFG_FRONTEND_DEV_PORT || process.env.FRONTEND_PORT,
  cfg.frontend.devPort,
);

const nextConfig: NextConfig = {
  output: "export",
  distDir: "renderer",
  trailingSlash: true,
  images: { unoptimized: true },
  serverExternalPackages: [],
  env: {
    APP_CFG_APP_LOCALE: cfg.app.locale,
    APP_CFG_BACKEND_HOST: backendHost,
    APP_CFG_BACKEND_PORT: String(backendPort),
    APP_CFG_FRONTEND_DEV_PORT: String(frontendDevPort),
    APP_CFG_NET_TIMEOUT: String(cfg.network.timeout),
    APP_CFG_NET_MAX_RETRIES: String(cfg.network.max_retries),
    APP_CFG_NET_RETRY_DELAY: String(cfg.network.retry_delay),
    APP_CFG_NET_RANDOM_CNIP: String(cfg.network.randomCNIP),
    APP_CFG_NET_PROXY_MODE: cfg.network.proxyMode,
    APP_CFG_NET_PROXY_URL: cfg.network.proxyUrl,
    APP_CFG_LOG_LEVEL: cfg.logging.level,
    APP_CFG_LOG_KEEP_DAYS: String(cfg.logging.keepDays),
  },
  allowedDevOrigins: ["192.168.3.8", "localhost", "127.0.0.1", "_next"],
};

export default nextConfig;
