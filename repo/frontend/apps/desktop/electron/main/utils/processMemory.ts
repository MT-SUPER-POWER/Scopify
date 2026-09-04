import { app, BrowserWindow, type ProcessMetric } from "electron";

import { coreLog } from "@main/utils/logger";

const PROCESS_MEMORY_LOG_INTERVAL_MS = 60_000;

const WINDOW_ROUTE_NAMES = new Map([
  ["/app-close", "app-close"],
  ["/desktop-lyrics", "desktop-lyric"],
  ["/desktop-playback-controller", "desktop-playback-controller"],
  ["/login", "login"],
  ["/tray", "tray"],
]);

function getWindowName(window: BrowserWindow, mainWindow: BrowserWindow | null): string | null {
  if (window === mainWindow) return "main";

  const url = window.webContents.getURL();
  try {
    const pathname = new URL(url).pathname.replace(/\/$/, "") || "/";
    return WINDOW_ROUTE_NAMES.get(pathname) ?? null;
  } catch {
    return null;
  }
}

function getProcessDetail(metric: ProcessMetric): string | undefined {
  return metric.name || metric.serviceName;
}

/** Record each Electron process working set so releases can be compared for memory regressions. */
export function logProcessMemory(mainWindow: BrowserWindow | null): void {
  const windowPids = new Map<number, string>();
  for (const window of BrowserWindow.getAllWindows()) {
    if (window.isDestroyed() || window.webContents.isDestroyed()) continue;
    const name = getWindowName(window, mainWindow);
    if (name) windowPids.set(window.webContents.getOSProcessId(), name);
  }

  const parts = app.getAppMetrics().map((metric) => {
    const workingSetMb = Math.round(metric.memory.workingSetSize / 1024);
    const detail = windowPids.get(metric.pid) ?? getProcessDetail(metric);
    const label = detail ? `${metric.type}(${detail})` : metric.type;
    return `${label} ${workingSetMb}MB`;
  });

  coreLog.info(`[memory] working set: ${parts.join(" | ")}`);
}

/** Start one immediate sample followed by stable one-minute samples. */
export function startProcessMemoryMonitor(getMainWindow: () => BrowserWindow | null): () => void {
  logProcessMemory(getMainWindow());
  const timer = setInterval(
    () => logProcessMemory(getMainWindow()),
    PROCESS_MEMORY_LOG_INTERVAL_MS,
  );
  timer.unref();
  return () => clearInterval(timer);
}
