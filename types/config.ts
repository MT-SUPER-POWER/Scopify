/**
 * 应用全局配置类型定义
 */
export interface AppConfig {
  app: {
    gpuAcceleration: boolean;
    devTools: boolean;
    closeAction: 0 | 1 | 2;   // 0: 最小化，1: 退出，2: 用户第一次打开程序，没做记录
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
    format?: string;
    keepDays: number;
  };
  network: {
    timeout: number;
    max_retries: number;
    retry_delay: number;
  };
}
