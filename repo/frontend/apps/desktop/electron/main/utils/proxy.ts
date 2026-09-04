import { type ProxyConfig, session } from "electron";

import type { DesktopHostConfig } from "@scopify/desktop-contract";

import { proxyLog } from "@main/utils/logger";

function buildProxyConfig(config: DesktopHostConfig): ProxyConfig {
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

export async function applyElectronProxy(config: DesktopHostConfig) {
  const proxyConfig = buildProxyConfig(config);
  proxyLog.info("[proxy] applying Electron proxy:", proxyConfig);

  await session.defaultSession.setProxy(proxyConfig);
  await session.defaultSession.forceReloadProxyConfig();
  await session.defaultSession.closeAllConnections();
}
