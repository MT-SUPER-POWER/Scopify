import axios from "axios";

/**
 * 等待后端服务就绪
 * @param url 后端地址
 * @param timeout 最大等待时间 (ms)
 * @param interval 检查间隔 (ms)
 */
export async function waitForBackend(
  url: string,
  timeout: number = 10000,
  interval: number = 500,
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      // 这里的 url 可能是 http://127.0.0.1:5252
      // 我们请求根路径，如果返回 200 (哪怕是 404，只要是后端响应的) 就认为就绪了
      await axios.get(url, { timeout: interval });
      return true;
    } catch (e: any) {
      // 如果是 ECONNREFUSED 说明还没起来，如果是其他错误说明响应了
      if (e.code !== "ECONNREFUSED" && e.code !== "ETIMEDOUT") {
        return true;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
}

/**
 * 快速检查后端是否可达（不做重试）。
 * @param url 后端地址
 * @param timeout 单次请求超时 (ms)
 */
export async function pingBackend(url: string, timeout: number = 3000): Promise<boolean> {
  try {
    await axios.get(url, { timeout });
    return true;
  } catch (error: unknown) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code && code !== "ECONNREFUSED" && code !== "ETIMEDOUT" && code !== "ENOTFOUND") {
      // 任何非网络层错误（如 404、500）都视为后端有响应
      return true;
    }
    return false;
  }
}
