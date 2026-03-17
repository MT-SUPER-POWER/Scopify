import type { NextConfig } from "next";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";
import type { AppConfig } from "./types/config";

// 构建时读取配置文件（优先 app.config.yml，回退到 default）
const configPath = join(process.cwd(), "config", "app.config.yml");
const defaultPath = join(process.cwd(), "config", "app.config.default.yml");
const raw = readFileSync(existsSync(configPath) ? configPath : defaultPath, "utf-8");
const cfg = yaml.load(raw) as AppConfig;

const nextConfig: NextConfig = {
  output: "export", // 静态导出，供 Electron 打包后加载
  distDir: "renderer", // Next.js 静态文件输出到 renderer/ 目录，与 Electron main 的 out/ 分开
  trailingSlash: true, // 解决打包之后使用 Link 导致的一些报错问题 (Dev Tools 可见)
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [],
  env: {
    APP_CFG_BACKEND_HOST: cfg.backend.host,
    APP_CFG_BACKEND_PORT: String(cfg.backend.port),
    APP_CFG_FRONTEND_DEV_PORT: String(cfg.frontend.devPort),
    APP_CFG_NET_TIMEOUT: String(cfg.network.timeout),
    APP_CFG_NET_MAX_RETRIES: String(cfg.network.max_retries),
    APP_CFG_NET_RETRY_DELAY: String(cfg.network.retry_delay),
    APP_CFG_LOG_LEVEL: cfg.logging.level,
  },
  // @ts-ignore - Next.js 15+ 移入顶层的配置
  allowedDevOrigins: ["192.168.3.8", "localhost", "127.0.0.1", "_next"],
};

export default nextConfig;
