import type {
  ConnectionPhase,
  ConnectionSnapshot,
  QueryRecoveryClock,
  QueryRecoveryConnection,
} from "@/types/query/recovery";

const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 20_000, 30_000];
const PERSISTENT_AFTER_ATTEMPTS = 3;
/** 主动恢复（成功联动、窗口聚焦）之间的最短间隔，避免同一个坏区域反复重置。 */
const NUDGE_COOLDOWN_MS = 3_000;

const systemClock: QueryRecoveryClock = {
  now: () => Date.now(),
  setTimer: (callback, delay) => setTimeout(callback, delay),
  clearTimer: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

export function isConnectionNoticeVisible(phase: ConnectionPhase) {
  return phase !== "ok" && phase !== "pending";
}

/**
 * 连接问题只有一个原因，所以由这里统一恢复：区域边界只登记自己的 reset，
 * 不再各自显示错误和重试按钮。探测成功、任一请求成功、重新联网或后端恢复时，所有等待区域一起重置。
 */
export function createQueryRecovery(clock: QueryRecoveryClock = systemClock) {
  const regions = new Set<() => void>();
  const listeners = new Set<() => void>();
  let connection: QueryRecoveryConnection | null = null;
  let online = true;
  let backendError: string | null = null;
  let attempts = 0;
  let retryAt: number | null = null;
  let isProbing = false;
  let lastAttemptAt = Number.NEGATIVE_INFINITY;
  let timer: unknown = null;

  const getPhase = (): ConnectionPhase => {
    if (backendError) return "backend";
    if (!online) return "offline";
    if (regions.size === 0) return "ok";
    if (attempts === 0) return "pending";
    return attempts >= PERSISTENT_AFTER_ATTEMPTS ? "persistent" : "degraded";
  };
  const compute = (): ConnectionSnapshot => ({
    phase: getPhase(),
    waitingRegions: regions.size,
    retryAt,
    isProbing,
    backendError,
  });
  let snapshot = compute();
  const notify = () => {
    snapshot = compute();
    listeners.forEach((listener) => listener());
  };

  const stopTimer = () => {
    if (timer !== null) clock.clearTimer(timer);
    timer = null;
    retryAt = null;
  };

  const schedule = () => {
    stopTimer();
    if (!online || backendError || regions.size === 0) return;
    const delay = RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length - 1)];
    retryAt = clock.now() + delay;
    timer = clock.setTimer(() => {
      timer = null;
      void probe();
    }, delay);
  };

  const recover = (wasVisible = isConnectionNoticeVisible(getPhase())) => {
    stopTimer();
    attempts = 0;
    lastAttemptAt = clock.now();
    const resets = [...regions];
    regions.clear();
    resets.forEach((reset) => reset());
    notify();
    connection?.onRecovered(wasVisible);
  };

  const probe = async () => {
    if (isProbing || !online || backendError || regions.size === 0) return;
    stopTimer();
    isProbing = true;
    lastAttemptAt = clock.now();
    notify();
    const recovered = await (connection?.probe() ?? Promise.resolve(true)).catch(() => false);
    isProbing = false;
    if (recovered) return recover();
    attempts += 1;
    schedule();
    notify();
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect(next: QueryRecoveryConnection) {
      connection = next;
      return () => {
        if (connection === next) connection = null;
      };
    },
    /** 区域因连接失败进入等待；返回值在区域卸载或自行重置时调用。 */
    register(reset: () => void) {
      regions.add(reset);
      if (regions.size === 1 && !isProbing) schedule();
      notify();
      return () => {
        if (!regions.delete(reset)) return;
        if (regions.size === 0) {
          stopTimer();
          attempts = 0;
        }
        notify();
      };
    },
    /** 用户点击“立即重试”：跳过当前的退避等待。 */
    retryNow: () => probe(),
    /** 窗口重新聚焦等低成本时机：冷却期外才探测。 */
    nudge() {
      if (clock.now() - lastAttemptAt >= NUDGE_COOLDOWN_MS) void probe();
    },
    /** 其他请求成功说明连接已经可用，直接恢复所有等待区域。 */
    noteSuccess() {
      if (regions.size === 0 || isProbing || backendError) return;
      if (clock.now() - lastAttemptAt < NUDGE_COOLDOWN_MS) return;
      recover();
    },
    setOnline(next: boolean) {
      if (online === next) return;
      const wasVisible = isConnectionNoticeVisible(getPhase());
      online = next;
      if (!next) stopTimer();
      notify();
      if (!next) return;
      // 没有等待区域时离线横条直接收起，同样告知用户已恢复。
      if (regions.size === 0) connection?.onRecovered(wasVisible);
      else void probe();
    },
    setBackendError(next: string | null) {
      if (backendError === next) return;
      const wasVisible = isConnectionNoticeVisible(getPhase());
      const recovered = backendError !== null && next === null;
      backendError = next;
      if (recovered) return recover(wasVisible);
      if (next) stopTimer();
      notify();
    },
  };
}

export const queryRecovery = createQueryRecovery();
