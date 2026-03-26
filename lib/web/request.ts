import axios, { InternalAxiosRequestConfig } from 'axios';
import { usePlayerStore, useUserStore } from '@/store';
import { appConfig, logger } from './env';
import { WEB_NETWORK_SETTINGS_KEY } from '@/app/(dashboard)/setting/useSettingsState';

// 扩展请求配置接口
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
  noRetry?: boolean;
  randomCNIP?: boolean; // 这个参数可以开机随机的中国 IP，但是不开好像没啥限制就是了
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ NETWORK CONFIG ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 获取当前生效的网络配置.
 * Web 模式下从 localStorage 读取用户覆盖值（通过 Settings 页面设置）；
 * Electron 模式下直接使用构建时注入的 appConfig。
 */
function getNetworkConfig() {
  const base = appConfig.network;
  if (typeof window === 'undefined' || (window as any).electronAPI) return base;
  try {
    const stored = localStorage.getItem(WEB_NETWORK_SETTINGS_KEY);
    if (stored) return { ...base, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return base;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 运行时优先取 preload 注入的后端地址（Electron 静态导出场景）
const INITIAL_BASE_URL = `http://${appConfig.backend.host}:${appConfig.backend.port}`;
let baseURL = INITIAL_BASE_URL;
const NO_RETRY_URLS = ['暂时没有'];

logger.info("--------------------------------------------------");
logger.info("Next.js Request Backend URL is", baseURL);
logger.info("--------------------------------------------------");

if (!baseURL) {
  throw new Error("请在 NEXT_CONFIG 或 Electron 运行时提供 BACKEND_URL");
}

const request = axios.create({
  baseURL,
  timeout: getNetworkConfig().timeout,
  withCredentials: true
});

// 在 Electron 环境：优先使用 preload/runtime 注入的配置覆盖构建时的值
if (typeof window !== 'undefined' && (window as any).electronAPI?.getAppConfig) {
  (async () => {
    try {
      const runtimeCfg = await (window as any).electronAPI.getAppConfig();
      const runtimeURL = `http://${runtimeCfg.backend.host}:${runtimeCfg.backend.port}`;
      if (runtimeURL && runtimeURL !== baseURL) {
        baseURL = runtimeURL;
        request.defaults.baseURL = baseURL;
        logger.info('Overrode Request Backend URL from Electron runtime:', baseURL);
      }
    } catch (e) {
      logger.warn('Failed to read runtime appConfig from Electron preload', e);
    }
  })();
}

// 判断是否为 Electron 环境
const isElectron = typeof window !== "undefined" && !!window.electronAPI;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ INTERCEPTOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 请求拦截器
request.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    if (!baseURL) {
      throw new Error("请在 NEXT_CONFIG 或 Electron 运行时提供 BACKEND_URL");
    }
    config.baseURL = baseURL;
    // 动态读取网络配置（Web 模式下支持 localStorage 覆盖）
    const networkCfg = getNetworkConfig();
    config.timeout = networkCfg.timeout;

    // 只在retryCount未定义时初始化为0
    if (config.retryCount === undefined) {
      config.retryCount = 0;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 在请求发送之前做一些处理 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // 请求中附带额外信息
    config.params = {
      ...config.params,
      timestamp: Date.now(),
      ...(isElectron ? { os: 'pc' } : { platform: 'web' }),
      randomCNIP: networkCfg.randomCNIP,
    };
    return config;
  },
  (error) => {
    // 当请求异常时做一些处理
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const resData = response.data;
    // 只拦截明确的全局业务错误
    if (resData && [250].includes(resData.code)) {
      // 这里可以扩展更多需要全局拦截的 code
      return Promise.reject({
        ...response,
        isBusinessError: true,
        businessMsg: resData.msg || resData.message,
        businessCode: resData.code,
      });
    }
    // 其它 code（如 800、801、802）直接返回，由业务层处理
    return response;
  },
  async (error) => {
    // 提取网易云 API 返回的详细错误信息
    const responseData = error.response?.data;
    const apiMsg = responseData?.msg || responseData?.message || error.message;
    const statusCode = error.response?.status || error.code || "UNKNOWN";

    // 格式化错误输出，确保在浏览器控制台能直接看到清晰的逻辑错误
    const logPrefix = `[API ${statusCode}]`;
    if (responseData) {
      logger.error(`${logPrefix} ${apiMsg}`, {
        url: error.config?.url,
        method: error.config?.method,
        status: statusCode,
        data: responseData
      });

      // 如果有具体的提示信息，通过 toast 展示给用户，避免用户不知道为什么操作失败
      if (apiMsg && typeof window !== 'undefined') {
        const { toast } = await import('sonner');
        // DEBUG: 这里所有的网易返回的错误都会在这里用 toast 展示
        toast.error(`操作失败: ${apiMsg}`);
      }
    } else {
      logger.error(`${logPrefix} Network or Server Error`, error);
    }

    const config = error.config as CustomAxiosRequestConfig;

    // 如果没有配置，直接返回错误
    if (!config) return Promise.reject(error);

    // 处理 301 状态码
    if (error.response?.status === 301 && config.params.noLogin !== true) {
      useUserStore.getState().handleLogout();
      usePlayerStore.getState().cleanCache();
      logger.info(`301 状态码，清除登录信息后重试第 ${config.retryCount} 次`);
      config.retryCount = 3;
    }

    // 检查是否还可以重试
    const { max_retries, retry_delay } = getNetworkConfig();
    if (
      config.retryCount !== undefined &&
      config.retryCount < max_retries &&
      !NO_RETRY_URLS.includes(config.url as string) &&
      !config.noRetry
    ) {
      config.retryCount++;
      logger.warn(`请求重试第 ${config.retryCount} 次`);

      // 延迟重试
      await new Promise((resolve) => setTimeout(resolve, retry_delay));

      // 重新发起请求
      return request(config);
    }

    logger.warn(`重试${max_retries}次后仍然失败`);
    return Promise.reject(error);
  }
);

export default request;
