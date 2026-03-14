import axios, { InternalAxiosRequestConfig } from 'axios';
import { usePlayerStore, useUserStore } from '@/store';
import { appConfig, logger } from './env';

let setData: any = null;

// 扩展请求配置接口
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
  noRetry?: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 运行时优先取 preload 注入的后端地址（Electron 静态导出场景）
const baseURL = `http://${appConfig.backend.host}:${appConfig.backend.port}`;
const MAX_RETRIES = appConfig.network.max_retries;
const RETRY_DELAY = appConfig.network.retry_delay;
const AXIOS_TIMEOUT = appConfig.network.timeout;
const NO_RETRY_URLS = ['暂时没有'];

logger.info("--------------------------------------------------");
logger.info("Next.js Request Base URL is", baseURL);
logger.info("--------------------------------------------------");

if (!baseURL) {
  throw new Error("请在 NEXT_CONFIG 或 Electron 运行时提供 BACKEND_URL");
}

const request = axios.create({
  baseURL,
  timeout: AXIOS_TIMEOUT,
  withCredentials: true
});

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

    // 只在retryCount未定义时初始化为0
    if (config.retryCount === undefined) {
      config.retryCount = 0;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 在请求发送之前做一些处理 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // 请求中附带额外信息
    config.params = {
      ...config.params,
      timestamp: Date.now(),
      device: isElectron ? 'pc' : 'web'
    };

    // 注意：假设你的 userStore 里存储 cookie 的字段叫 cookie，如果叫别的名字请对应修改
    let _cookie = (useUserStore.getState() as any).cookie as string | undefined;

    // 如果内存里没有，且处于浏览器环境，再去 localStorage 拿（做兜底）
    if (!_cookie && typeof window !== 'undefined') {
      _cookie = localStorage.getItem('cookie') || '';
    }

    if (_cookie) {
      // 1. 放入 HTTP 请求头 (Standard way)
      config.headers.set('Cookie', _cookie);

      // 2. 移除 Params 和 Body 中的 cookie 参数，避免冗余和潜在的格式冲突
      // 如果后端支持 Header 识别，则不需要在 URL 或 Body 中重复传输
      if (config.method?.toLowerCase() === 'post' && config.data?.cookie) {
        delete config.data.cookie;
      } else if (config.params?.cookie) {
        delete config.params.cookie;
      }
    }

    if (isElectron) {
      const proxyConfig = setData?.proxyConfig;
      if (proxyConfig?.enable && ['http', 'https'].includes(proxyConfig?.protocol)) {
        config.params.proxy = `${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`;
      }
      if (setData?.enableRealIP && setData?.realIP) {
        config.params.realIP = setData.realIP;
      }
    }

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
    if (
      config.retryCount !== undefined &&
      config.retryCount < MAX_RETRIES &&
      !NO_RETRY_URLS.includes(config.url as string) &&
      !config.noRetry
    ) {
      config.retryCount++;
      logger.warn(`请求重试第 ${config.retryCount} 次`);

      // 延迟重试
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

      // 重新发起请求
      return request(config);
    }

    logger.warn(`重试${MAX_RETRIES}次后仍然失败`);
    return Promise.reject(error);
  }
);

export default request;
