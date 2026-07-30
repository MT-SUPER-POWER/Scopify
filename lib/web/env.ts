import type { AppConfig } from "@/types/config";
import { DEFAULT_APP_CONFIG } from "@/types/config";

export { logger } from "./logger";

export const appConfig: AppConfig = {
  app: {
    ...DEFAULT_APP_CONFIG.app,
    locale:
      (process.env.APP_CFG_APP_LOCALE as AppConfig["app"]["locale"]) ||
      DEFAULT_APP_CONFIG.app.locale,
  },
  backend: {
    ...DEFAULT_APP_CONFIG.backend,
    host: process.env.APP_CFG_BACKEND_HOST || DEFAULT_APP_CONFIG.backend.host,
    port: Number(process.env.APP_CFG_BACKEND_PORT || DEFAULT_APP_CONFIG.backend.port),
  },
  frontend: {
    ...DEFAULT_APP_CONFIG.frontend,
    devPort: Number(process.env.APP_CFG_FRONTEND_DEV_PORT || DEFAULT_APP_CONFIG.frontend.devPort),
    host: DEFAULT_APP_CONFIG.frontend.host,
  },
  logging: {
    ...DEFAULT_APP_CONFIG.logging,
    level:
      (process.env.APP_CFG_LOG_LEVEL as AppConfig["logging"]["level"]) ||
      DEFAULT_APP_CONFIG.logging.level,
    keepDays: Number(process.env.APP_CFG_LOG_KEEP_DAYS || DEFAULT_APP_CONFIG.logging.keepDays),
  },
  network: {
    ...DEFAULT_APP_CONFIG.network,
    timeout: Number(process.env.APP_CFG_NET_TIMEOUT || DEFAULT_APP_CONFIG.network.timeout),
    randomCNIP: process.env.APP_CFG_NET_RANDOM_CNIP === "true" ? "true" : "false",
    proxyMode:
      (process.env.APP_CFG_NET_PROXY_MODE as AppConfig["network"]["proxyMode"]) ||
      DEFAULT_APP_CONFIG.network.proxyMode,
    proxyUrl: String(process.env.APP_CFG_NET_PROXY_URL || DEFAULT_APP_CONFIG.network.proxyUrl),
  },
  cache: {
    ...DEFAULT_APP_CONFIG.cache,
  },
  updater: {
    ...DEFAULT_APP_CONFIG.updater,
  },
};
