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

const nextConfig: NextConfig = {
  output: "export",
  distDir: "renderer",
  trailingSlash: true,
  images: { unoptimized: true },
  serverExternalPackages: [],
  env: {
    APP_CFG_APP_LOCALE: cfg.app.locale,
    APP_CFG_BACKEND_HOST: cfg.backend.host,
    APP_CFG_BACKEND_PORT: String(cfg.backend.port),
    APP_CFG_FRONTEND_DEV_PORT: String(cfg.frontend.devPort),
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
