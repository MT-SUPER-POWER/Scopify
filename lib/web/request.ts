import axios, { InternalAxiosRequestConfig } from 'axios';
import { useIsElectron } from '@/lib/hooks/useElectronDetect';
import { usePlayerStore, useUserStore } from '@/store';

let setData: any = null;

// 扩展请求配置接口
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
  noRetry?: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 运行时优先取 preload 注入的后端地址（Electron 静态导出场景）
const baseURL = process.env.BACKEND_URL || "http://127.0.0.1:3838";
const MAX_RETRIES = Number(process.env.MAX_RETRIES) || 1;    // 最大重试次数
const RETRY_DELAY = Number(process.env.RETRY_DELAY) || 500;  // 重试延迟（毫秒）
const AXIOS_TIMEOUT = Number(process.env.AXIOS_TIMEOUT) || 5000; // 最大请求时间（毫秒）
const NO_RETRY_URLS = ['暂时没有'];

if (!baseURL) {
  throw new Error("请在 NEXT_CONFIG 或 Electron 运行时提供 BACKEND_URL");
}

const request = axios.create({
  baseURL,
  timeout: AXIOS_TIMEOUT,
  withCredentials: true
});

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
      device: useIsElectron() ? 'pc' : 'web'
    };

    // 注意：假设你的 userStore 里存储 cookie 的字段叫 cookie，如果叫别的名字请对应修改
    let _cookie = (useUserStore.getState() as any).cookie as string | undefined;

    // 如果内存里没有，且处于浏览器环境，再去 localStorage 拿（做兜底）
    if (!_cookie && typeof window !== 'undefined') {
      _cookie = localStorage.getItem('cookie') || '';
    }

    if (_cookie) {
      if (config.method?.toLowerCase() === 'post') {
        // POST 请求，放在请求体 (Body) 里
        config.data = {
          ...config.data,
          cookie: _cookie
        };
      } else {
        config.params.cookie = config.params.cookie || _cookie;
      }
    }

    if (useIsElectron()) {
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
    console.error('error', error);
    const config = error.config as CustomAxiosRequestConfig;

    // 如果没有配置，直接返回错误
    if (!config) return Promise.reject(error);

    // 处理 301 状态码
    if (error.response?.status === 301 && config.params.noLogin !== true) {
      useUserStore.getState().handleLogout();
      usePlayerStore.getState().cleanCache();
      console.log(`301 状态码，清除登录信息后重试第 ${config.retryCount} 次`);
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
      console.warn(`请求重试第 ${config.retryCount} 次`);

      // 延迟重试
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

      // 重新发起请求
      return request(config);
    }

    console.warn(`重试${MAX_RETRIES}次后仍然失败`);
    return Promise.reject(error);
  }
);

export default request;
