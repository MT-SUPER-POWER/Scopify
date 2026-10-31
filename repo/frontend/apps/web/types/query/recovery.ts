/**
 * 全局连接状态：
 * - `pending`：刚有区域因连接失败进入等待，第一次探测前保持静默，避免网络抖动闪出提示。
 * - `degraded` / `persistent`：探测失败一次 / 多次，由横条提示并自动退避重连。
 * - `offline`：浏览器离线，等待 online 事件。
 * - `backend`：桌面端本地后端报错，由后端状态事件驱动恢复。
 */
export type ConnectionPhase = "ok" | "pending" | "degraded" | "persistent" | "offline" | "backend";

export interface ConnectionSnapshot {
  phase: ConnectionPhase;
  waitingRegions: number;
  retryAt: number | null;
  isProbing: boolean;
  backendError: string | null;
}

export interface QueryRecoveryConnection {
  /** 重新请求一个失败的请求；返回 true 表示连接已恢复。 */
  probe(): Promise<boolean>;
  /** 等待区域已重置之后调用；`wasVisible` 表示用户此前看到了连接提示。 */
  onRecovered(wasVisible: boolean): void;
}

export interface QueryRecoveryClock {
  now(): number;
  setTimer(callback: () => void, delay: number): unknown;
  clearTimer(timer: unknown): void;
}
