import axios from "axios";

import type { BackendPingResult } from "@/types/network";

interface BackendVersionPayload {
  code?: unknown;
  data?: { version?: unknown };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBackendVersionPayload(value: unknown): value is BackendVersionPayload {
  return isRecord(value) && value.code === 200;
}

function resolveFailureReason(error: unknown): "network" | "timeout" {
  const code = axios.isAxiosError(error) ? error.code : undefined;
  return code === "ECONNABORTED" || code === "ETIMEDOUT" ? "timeout" : "network";
}

function resolveLatency(startedAt: number) {
  return Math.max(0, Date.now() - startedAt);
}

/**
 * Performs a strict backend health probe against the public, unauthenticated
 * version endpoint. Unlike the startup wait helper, a 404/500 is not treated
 * as a healthy backend because the configured remote may be the wrong service.
 */
export async function probeBackend(url: string, timeout = 10000): Promise<BackendPingResult> {
  const pingUrl = url.endsWith("/") ? `${url}inner/version` : `${url}/inner/version`;
  const startedAt = Date.now();

  try {
    const response = await axios.get<unknown>(pingUrl, {
      timeout,
      withCredentials: true,
      validateStatus: () => true,
    });
    const latencyMs = resolveLatency(startedAt);
    const payload = response.data;

    if (response.status < 200 || response.status >= 300) {
      return { latencyMs, reachable: false, reason: "server", status: response.status, url };
    }

    if (!isBackendVersionPayload(payload)) {
      return {
        latencyMs,
        reachable: false,
        reason: "invalid-response",
        status: response.status,
        url,
      };
    }

    const version =
      isRecord(payload.data) && typeof payload.data.version === "string"
        ? payload.data.version
        : null;
    return { latencyMs, reachable: true, url, version };
  } catch (error: unknown) {
    return {
      latencyMs: resolveLatency(startedAt),
      reachable: false,
      reason: resolveFailureReason(error),
      url,
    };
  }
}

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
  const pingUrl = url.endsWith("/") ? `${url}inner/version` : `${url}/inner/version`;
  while (Date.now() - startTime < timeout) {
    try {
      // 避免请求根路径 / 导致 CORS 报错（后端在根路径下不返回 Access-Control-Allow-Origin）
      // 请求一个有效的 API 路径 /inner/version，会经过后端 CORS 中间件处理并返回 200
      await axios.get(pingUrl, { timeout: interval, withCredentials: true });
      return true;
    } catch (error: unknown) {
      // 如果是 ECONNREFUSED 说明还没起来，如果是其他错误说明响应了
      const code = axios.isAxiosError(error) ? error.code : undefined;
      if (code !== "ECONNREFUSED" && code !== "ETIMEDOUT") {
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
export async function pingBackend(url: string, timeout: number = 10000): Promise<boolean> {
  return (await probeBackend(url, timeout)).reachable;
}
