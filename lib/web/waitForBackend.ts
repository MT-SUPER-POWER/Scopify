import axios from 'axios';

/**
 * 等待后端服务就绪
 * @param url 后端地址
 * @param timeout 最大等待时间 (ms)
 * @param interval 检查间隔 (ms)
 */
export async function waitForBackend(url: string, timeout: number = 10000, interval: number = 500): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      // 这里的 url 可能是 http://127.0.0.1:5252
      // 我们请求根路径，如果返回 200 (哪怕是 404，只要是后端响应的) 就认为就绪了
      await axios.get(url, { timeout: interval });
      return true;
    } catch (e: any) {
      // 如果是 ECONNREFUSED 说明还没起来，如果是其他错误说明响应了
      if (e.code !== 'ECONNREFUSED' && e.code !== 'ETIMEDOUT') {
        return true;
      }
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
}
