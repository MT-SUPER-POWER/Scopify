import type { WebConfig } from "@/types/config";
import { DEFAULT_WEB_CONFIG } from "@/types/config";

export const webConfig: WebConfig = {
  app: {
    locale:
      (process.env.APP_CFG_APP_LOCALE as WebConfig["app"]["locale"]) ||
      DEFAULT_WEB_CONFIG.app.locale,
  },
  backend: {
    host: process.env.APP_CFG_BACKEND_HOST || DEFAULT_WEB_CONFIG.backend.host,
    port: Number(process.env.APP_CFG_BACKEND_PORT || DEFAULT_WEB_CONFIG.backend.port),
    protocol:
      process.env.APP_CFG_BACKEND_PROTOCOL === "https"
        ? "https"
        : DEFAULT_WEB_CONFIG.backend.protocol,
  },
  network: {
    timeout: Number(process.env.APP_CFG_NET_TIMEOUT || DEFAULT_WEB_CONFIG.network.timeout),
    randomCNIP: process.env.APP_CFG_NET_RANDOM_CNIP === "true" ? "true" : "false",
  },
};
