/**
 * 应用全局配置类型定义
 */
export const APP_LOCALES = ["zh-CN", "zh-TW", "en-US"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const ELECTRON_PROXY_MODES = ["system", "direct", "custom"] as const;
export type ElectronProxyMode = (typeof ELECTRON_PROXY_MODES)[number];

export interface AppConfig {
  app: {
    gpuAcceleration: boolean;
    devTools: boolean;
    closeAction: 0 | 1 | 2; // 0: 最小化，1: 退出，2: 每次询问
    locale: AppLocale;
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
    randomCNIP: string;
    proxyMode: ElectronProxyMode;
    proxyUrl: string;
  };
}

export type PartialAppConfig = {
  [Section in keyof AppConfig]?: Partial<AppConfig[Section]>;
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  app: {
    gpuAcceleration: true,
    devTools: false,
    closeAction: 2,
    locale: "zh-CN",
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
    format: "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}",
    keepDays: 7,
  },
  network: {
    timeout: 5000,
    max_retries: 1,
    retry_delay: 500,
    randomCNIP: "false",
    proxyMode: "system",
    proxyUrl: "",
  },
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && APP_LOCALES.includes(value as AppLocale);
}

export function isElectronProxyMode(value: unknown): value is ElectronProxyMode {
  return typeof value === "string" && ELECTRON_PROXY_MODES.includes(value as ElectronProxyMode);
}

function normalizeRandomCNIP(value: unknown): string {
  if (value === true || value === "true") return "true";
  return "false";
}

export function normalizeAppConfig(input?: PartialAppConfig | null): AppConfig {
  const locale = input?.app?.locale;
  const proxyMode = input?.network?.proxyMode;
  const proxyUrl = input?.network?.proxyUrl;

  return {
    app: {
      ...DEFAULT_APP_CONFIG.app,
      ...input?.app,
      locale: isAppLocale(locale) ? locale : DEFAULT_APP_CONFIG.app.locale,
    },
    backend: {
      ...DEFAULT_APP_CONFIG.backend,
      ...input?.backend,
    },
    frontend: {
      ...DEFAULT_APP_CONFIG.frontend,
      ...input?.frontend,
    },
    logging: {
      ...DEFAULT_APP_CONFIG.logging,
      ...input?.logging,
    },
    network: {
      ...DEFAULT_APP_CONFIG.network,
      ...input?.network,
      randomCNIP: normalizeRandomCNIP(input?.network?.randomCNIP),
      proxyMode: isElectronProxyMode(proxyMode) ? proxyMode : DEFAULT_APP_CONFIG.network.proxyMode,
      proxyUrl:
        typeof proxyUrl === "string" ? proxyUrl.trim() : DEFAULT_APP_CONFIG.network.proxyUrl,
    },
  };
}
