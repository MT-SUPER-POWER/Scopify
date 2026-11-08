import type { WebConfig } from "@/types/settings/config";
import { DEFAULT_WEB_CONFIG } from "@/types/settings/config";

export const webConfig: WebConfig = {
  app: {
    locale:
      (process.env.APP_CFG_APP_LOCALE as WebConfig["app"]["locale"]) ||
      DEFAULT_WEB_CONFIG.app.locale,
  },
  backend: {
    // The `APP_CFG_BACKEND_*` variables predate QQ Music and keep addressing the NetEase API.
    netease: {
      host: process.env.APP_CFG_BACKEND_HOST || DEFAULT_WEB_CONFIG.backend.netease.host,
      port: Number(process.env.APP_CFG_BACKEND_PORT || DEFAULT_WEB_CONFIG.backend.netease.port),
      protocol:
        process.env.APP_CFG_BACKEND_PROTOCOL === "https"
          ? "https"
          : DEFAULT_WEB_CONFIG.backend.netease.protocol,
    },
    qq: { ...DEFAULT_WEB_CONFIG.backend.qq },
  },
  network: {
    timeout: Number(process.env.APP_CFG_NET_TIMEOUT || DEFAULT_WEB_CONFIG.network.timeout),
  },
  netease: {
    randomCNIP: process.env.APP_CFG_NET_RANDOM_CNIP === "true" ? "true" : "false",
  },
};
