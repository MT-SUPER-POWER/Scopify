/**
 * Web 侧使用的配置与 logger 替代品
 * ⚠️ 不能引用 main/ 下的任何文件，避免 electron/fs/electron-log 被 Next.js 打包
 * 配置值由 next.config.ts 在构建时从 config/app.config.yml 读取并注入 process.env.
 */

import type { AppConfig } from "@/types/config";

export const appConfig: AppConfig = {
  app: {
    gpuAcceleration: true,
    devTools: false,
    closeAction: 2,
  },
  backend: {
    host: process.env.APP_CFG_BACKEND_HOST || "127.0.0.1",
    port: Number(process.env.APP_CFG_BACKEND_PORT || 3838),
    autoStart: true,
  },
  frontend: {
    devPort: Number(process.env.APP_CFG_FRONTEND_DEV_PORT || 3000),
    host: "127.0.0.1",
  },
  logging: {
    level: (process.env.APP_CFG_LOG_LEVEL as AppConfig["logging"]["level"]) || "info",
    keepDays: 7,
  },
  network: {
    timeout: Number(process.env.APP_CFG_NET_TIMEOUT || 5000),
    max_retries: Number(process.env.APP_CFG_NET_MAX_RETRIES || 1),
    retry_delay: Number(process.env.APP_CFG_NET_RETRY_DELAY || 500),
    randomCNIP: String(process.env.APP_CFG_NET_RANDOM_CNIP || "false"),
  },
};

// ── 轻量 logger（renderer 侧直接用 console）───────────────────────────────────
export const logger = {
  info: (...args: unknown[]) => console.info("[renderer]", ...args),
  warn: (...args: unknown[]) => console.warn("[renderer]", ...args),
  error: (...args: unknown[]) => {
    if (args[0] instanceof Error) {
      throw args[0];
    } else {
      throw new Error(args.map(String).join(" "));
    }
  },
  debug: (...args: unknown[]) => console.debug("[renderer]", ...args),
};
