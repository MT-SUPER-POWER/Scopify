import { app } from "electron";
import { join } from "path";
import fs from "fs";
import * as TOML from "@iarna/toml";

/**
 * 应用全局配置类型定义
 */
export interface AppConfig {
  app: {
    gpuAcceleration: boolean;
    devTools: boolean;
    closeAction: 0 | 1; // 0: 最小化，1: 退出
  };
  backend: {
    port: number;
    host: string;
    autoStart: boolean;
  };
  frontend: {
    devPort: number;
    host: string;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    enableFile: boolean;
  };
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: AppConfig = {
  app: {
    gpuAcceleration: true,
    devTools: false,
    closeAction: 0, // 默认点击关闭最小化
  },
  backend: {
    port: 3838,
    host: "127.0.0.1",
    autoStart: true,
  },
  frontend: {
    devPort: 3000,
    host: "127.0.0.1",
  },
  logging: {
    level: "info",
    enableFile: false,
  },
};

/**
 * 获取配置文件路径
 */
function getConfigPath(): string {
  if (!app.isPackaged) {
    // 开发态：项目根目录的 config/app.config.toml
    return join(__dirname, "..", "..", "config", "app.config.toml");
  }
  // 打包态：userData 目录下的配置
  return join(app.getPath("userData"), "app.config.toml");
}

/**
 * 创建默认配置文件（如果不存在）
 */
function ensureConfigFile(): void {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) return;

  const dir = configPath.split(/[/\\]/).slice(0, -1).join("/");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tomlStr = TOML.stringify(DEFAULT_CONFIG as any);
  fs.writeFileSync(configPath, tomlStr, "utf-8");
  console.log(`[config] Created default config at ${configPath}`);
}

/**
 * 加载配置文件
 */
export function loadAppConfig(): AppConfig {
  ensureConfigFile();

  const configPath = getConfigPath();
  try {
    const content = fs.readFileSync(configPath, "utf-8");
    const parsed = TOML.parse(content) as any;

    // 深度合并用户配置与默认配置（用户配置优先）
    const merged: AppConfig = {
      app: { ...DEFAULT_CONFIG.app, ...parsed.app },
      backend: { ...DEFAULT_CONFIG.backend, ...parsed.backend },
      frontend: { ...DEFAULT_CONFIG.frontend, ...parsed.frontend },
      logging: { ...DEFAULT_CONFIG.logging, ...parsed.logging },
    };

    console.log(`[config] Loaded from ${configPath}`, merged);
    return merged;
  } catch (err) {
    console.error(`[config] Failed to parse ${configPath}, using defaults:`, err);
    return DEFAULT_CONFIG;
  }
}

/**
 * 获取环境变量覆盖后的最终配置
 * 优先级：环境变量 > 配置文件 > 默认值
 */
export function getFinalConfig(): AppConfig {
  const fileConfig = loadAppConfig();

  // 从环境变量读取覆盖值
  return {
    app: {
      gpuAcceleration: process.env.GPU_ACCELERATION !== "false" && fileConfig.app.gpuAcceleration,
      devTools: process.env.DEV_TOOLS === "true" || fileConfig.app.devTools,
      closeAction: process.env.CLOSE_ACTION ? (parseInt(process.env.CLOSE_ACTION) as 0 | 1) : fileConfig.app.closeAction,
    },
    backend: {
      port: process.env.BACKEND_DEFAULT_PORT ? parseInt(process.env.BACKEND_DEFAULT_PORT) : fileConfig.backend.port,
      host: process.env.BACKEND_HOST ?? fileConfig.backend.host,
      autoStart: process.env.BACKEND_AUTO_START !== "false" && fileConfig.backend.autoStart,
    },
    frontend: {
      devPort: process.env.NEXT_PORT ? parseInt(process.env.NEXT_PORT) : fileConfig.frontend.devPort,
      host: process.env.FRONTEND_HOST ?? fileConfig.frontend.host,
    },
    logging: {
      level: (process.env.LOG_LEVEL as any) ?? fileConfig.logging.level,
      enableFile: process.env.LOG_FILE === "true" || fileConfig.logging.enableFile,
    },
  };
}
