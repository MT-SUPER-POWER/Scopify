import { useCallback } from 'react';
import { useRouter as useNextRouter } from 'next/navigation';

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
 *
 * FIXME: 方案 A：在 Electron 中也优先使用 Next.js 原生路由 (nextRouter.push/replace)。
 * 这样可以确保 App Router 的布局架构和状态保持一致。
 * 只有在路由完全失效或有特殊需求时，才考虑回退到 Hash 模式。
 */
export function useSmartRouter() {
  const nextRouter = useNextRouter();

  // 原生的跳转实现（Web/Electron 通用）
  const push = useCallback((url: string, query?: QueryParams) => {
    nextRouter.push(buildUrlWithQuery(url, query));
  }, [nextRouter]);

  const replace = useCallback((url: string, query?: QueryParams) => {
    nextRouter.replace(buildUrlWithQuery(url, query));
  }, [nextRouter]);

  const back = useCallback(() => {
    nextRouter.back();
  }, [nextRouter]);

  const forward = useCallback(() => {
    nextRouter.forward();
  }, [nextRouter]);

  return {
    push,
    replace,
    back,
    forward,
    // 同时也保留原始 nextRouter 供备用
    native: nextRouter
  };
}
