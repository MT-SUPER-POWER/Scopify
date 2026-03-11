import { useCallback } from 'react';
import { useRouter as useNextRouter } from 'next/navigation';
import { useIsElectron } from './useElectronDetect';

// 定义查询参数的类型，支持基础类型和对象
type QueryParams = Record<string, string | number | boolean | object | null | undefined>;

/**
 * 辅助函数：将对象转换为 URL 查询字符串并拼接到 URL 后
 */
const buildUrlWithQuery = (url: string, query?: QueryParams) => {
  if (!query || Object.keys(query).length === 0) return url;

  // 分离原有的 path 和可能已经存在的 query
  const [path, existingQuery] = url.split('?');
  const params = new URLSearchParams(existingQuery || '');

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    // 如果是对象或数组，使用 JSON 序列化；其他类型直接转为字符串
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    params.set(key, strValue);
  });

  return `${path}?${params.toString()}`;
};

/**
 * 智能路由 hook，根据环境自动切换路由实现。
 */
export function useSmartRouter() {
  const nextRouter = useNextRouter();

  // Electron 环境下的路由跳转
  const electronPush = useCallback((url: string, query?: QueryParams) => {
    const finalUrl = buildUrlWithQuery(url, query);
    window.location.hash = finalUrl.startsWith('#') ? finalUrl : `#${finalUrl}`;
  }, []);

  const electronReplace = useCallback((url: string, query?: QueryParams) => {
    const finalUrl = buildUrlWithQuery(url, query);
    window.location.replace(`#${finalUrl.replace(/^#/, '')}`);
  }, []);

  const electronBack = useCallback(() => {
    window.history.back();
  }, []);

  // Web 环境下的路由跳转
  const webPush = useCallback((url: string, query?: QueryParams) => {
    nextRouter.push(buildUrlWithQuery(url, query));
  }, [nextRouter]);

  const webReplace = useCallback((url: string, query?: QueryParams) => {
    nextRouter.replace(buildUrlWithQuery(url, query));
  }, [nextRouter]);

  const webBack = useCallback(() => {
    nextRouter.back();
  }, [nextRouter]);

  const isElectronEnv = useIsElectron();

  return {
    push: isElectronEnv ? electronPush : webPush,
    replace: isElectronEnv ? electronReplace : webReplace,
    back: isElectronEnv ? electronBack : webBack,
  };
}
