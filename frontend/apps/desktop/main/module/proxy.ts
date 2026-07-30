import { type ProxyConfig, session } from "electron";

import type { AppConfig } from "@/types/config";

import { logger } from "../constants.js";

function buildProxyConfig(config: AppConfig): ProxyConfig {
  const { proxyMode, proxyUrl } = config.network;

  if (proxyMode === "direct") {
    return { mode: "direct" };
  }

  if (proxyMode === "custom" && proxyUrl) {
    return {
      mode: "fixed_servers",
      proxyRules: proxyUrl,
    };
  }

  return { mode: "system" };
}

export async function applyElectronProxy(config: AppConfig) {
  const proxyConfig = buildProxyConfig(config);
  logger.info("[proxy] applying Electron proxy:", proxyConfig);

  await session.defaultSession.setProxy(proxyConfig);
  await session.defaultSession.forceReloadProxyConfig();
  await session.defaultSession.closeAllConnections();
}
