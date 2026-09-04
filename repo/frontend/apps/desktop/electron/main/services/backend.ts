import { spawn, type ChildProcessByStdio } from "node:child_process";
import { existsSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { join, resolve } from "node:path";
import type { Readable } from "node:stream";
import { app } from "electron";
import type {
  DesktopBackendStatus,
  DesktopBackendState,
  DesktopHostConfig,
} from "@scopify/desktop-contract";
import { formatBackendChildOutput, formatBackendLogEntry } from "./backendOutput";

const BACKEND_HOST = "127.0.0.1";
const BACKEND_START_TIMEOUT_MS = 20_000;
const BACKEND_PROBE_TIMEOUT_MS = 750;
const BACKEND_PROBE_INTERVAL_MS = 250;

type BackendChild = ChildProcessByStdio<null, Readable, Readable>;

interface BackendProbeResult {
  occupied: boolean;
  reachable: boolean;
}

interface BackendControllerOptions {
  log: {
    error(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
  };
}

export interface DesktopBackendController {
  dispose(): Promise<void>;
  getStatus(): DesktopBackendStatus;
  onStatusChanged(callback: (status: DesktopBackendStatus) => void): () => void;
  reconcile(config: DesktopHostConfig["backend"]): Promise<DesktopBackendStatus>;
}

function backendOrigin(port: number) {
  return `http://${BACKEND_HOST}:${port}`;
}

function createStatus(
  state: DesktopBackendState,
  port: number,
  overrides: Partial<DesktopBackendStatus> = {},
): DesktopBackendStatus {
  return {
    error: null,
    host: BACKEND_HOST,
    managed: false,
    origin: backendOrigin(port),
    pid: null,
    port,
    source: null,
    state,
    ...overrides,
  };
}

function isHealthyVersionPayload(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const payload = value as { code?: unknown };
  return payload.code === 200;
}

function probeBackend(port: number): Promise<BackendProbeResult> {
  return new Promise((resolveProbe) => {
    let settled = false;
    const finish = (result: BackendProbeResult) => {
      if (settled) return;
      settled = true;
      resolveProbe(result);
    };

    const request = httpRequest(
      {
        hostname: BACKEND_HOST,
        method: "GET",
        path: "/inner/version",
        port,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => {
          if (Buffer.byteLength(Buffer.concat(chunks)) < 64 * 1024) chunks.push(chunk);
        });
        response.once("end", () => {
          let payload: unknown = null;
          try {
            payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            // A non-JSON response still proves that another process owns the port.
          }
          finish({
            occupied: true,
            reachable:
              response.statusCode !== undefined &&
              response.statusCode >= 200 &&
              response.statusCode < 300 &&
              isHealthyVersionPayload(payload),
          });
        });
      },
    );

    request.setTimeout(BACKEND_PROBE_TIMEOUT_MS, () => {
      request.destroy();
      finish({ occupied: true, reachable: false });
    });
    request.once("error", (error: NodeJS.ErrnoException) => {
      finish({ occupied: error.code !== "ECONNREFUSED", reachable: false });
    });
    request.end();
  });
}

function waitForBackendReady(port: number, child: BackendChild) {
  return new Promise<boolean>((resolveReady) => {
    const startedAt = Date.now();
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearInterval(interval);
      resolveReady(ready);
    };

    const timeout = setTimeout(() => finish(false), BACKEND_START_TIMEOUT_MS);
    const interval = setInterval(() => {
      if (child.exitCode !== null || Date.now() - startedAt >= BACKEND_START_TIMEOUT_MS) {
        finish(false);
        return;
      }
      void probeBackend(port).then((probe) => {
        if (probe.reachable) finish(true);
      });
    }, BACKEND_PROBE_INTERVAL_MS);

    void probeBackend(port).then((probe) => {
      if (probe.reachable) finish(true);
    });
  });
}

async function stopChild(child: BackendChild) {
  if (child.exitCode !== null) return;

  await new Promise<void>((resolveStopped) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolveStopped();
    };
    const timeout = setTimeout(finish, 3_000);
    child.once("close", finish);
    child.kill();
  });
}

function resolveBackendRoot() {
  if (app.isPackaged) return join(process.resourcesPath, "backend");
  return resolve(app.getAppPath(), "../../../backend/api-enhanced");
}

function resolveBackendEntry(backendRoot: string) {
  if (app.isPackaged) return join(backendRoot, "entry.cjs");
  return resolve(app.getAppPath(), "resources/backend-entry.cjs");
}

export function createDesktopBackendController(
  options: BackendControllerOptions,
  initialConfig: DesktopHostConfig["backend"],
): DesktopBackendController {
  let status = createStatus(initialConfig.autoStart ? "stopped" : "disabled", initialConfig.port);
  let child: BackendChild | null = null;
  let activePort: number | null = null;
  let generation = 0;
  let disposed = false;
  const listeners = new Set<(nextStatus: DesktopBackendStatus) => void>();

  const setStatus = (nextStatus: DesktopBackendStatus) => {
    status = nextStatus;
    listeners.forEach((listener) => listener(status));
  };

  const stopManagedChild = async () => {
    const currentChild = child;
    child = null;
    activePort = null;
    if (!currentChild) return;
    setStatus(createStatus("stopped", status.port));
    await stopChild(currentChild);
  };

  const startManagedChild = async (port: number, currentGeneration: number) => {
    const backendRoot = resolveBackendRoot();
    const backendEntry = resolveBackendEntry(backendRoot);
    if (!existsSync(backendEntry)) {
      const error = `本地后端资源不存在：${backendEntry}`;
      options.log.error("[backend] %s", error);
      setStatus(createStatus("error", port, { error }));
      return status;
    }

    setStatus(createStatus("starting", port, { managed: true, source: "managed" }));

    try {
      const nextChild = spawn(process.execPath, [backendEntry], {
        cwd: backendRoot,
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: "1",
          HOST: BACKEND_HOST,
          PORT: String(port),
        },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
      child = nextChild;
      activePort = port;
      nextChild.stdout.on("data", (data: Buffer) => {
        const message = formatBackendChildOutput(data);
        if (message) options.log.info("%s", formatBackendLogEntry(message));
      });
      nextChild.stderr.on("data", (data: Buffer) => {
        const message = formatBackendChildOutput(data);
        if (message) options.log.error("%s", formatBackendLogEntry(message));
      });
      nextChild.once("error", (error) => {
        if (child !== nextChild) return;
        child = null;
        activePort = null;
        setStatus(createStatus("error", port, { error: error.message }));
      });
      nextChild.once("exit", (code, signal) => {
        if (child !== nextChild || disposed) return;
        child = null;
        activePort = null;
        const error = `本地后端已退出${code === null ? `（${signal ?? "未知信号"}）` : `（代码 ${code}）`}`;
        setStatus(createStatus("error", port, { error }));
      });

      const ready = await waitForBackendReady(port, nextChild);
      if (currentGeneration !== generation || disposed) return status;
      if (ready) {
        setStatus(
          createStatus("running", port, {
            managed: true,
            pid: nextChild.pid ?? null,
            source: "managed",
          }),
        );
        options.log.info("[backend] local backend is ready at %s", backendOrigin(port));
        return status;
      }

      if (child === nextChild) await stopManagedChild();
      const error = `本地后端在 ${BACKEND_START_TIMEOUT_MS}ms 内未就绪，请检查端口或日志。`;
      setStatus(createStatus("error", port, { error }));
      return status;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(createStatus("error", port, { error: message }));
      return status;
    }
  };

  return {
    async dispose() {
      disposed = true;
      generation += 1;
      await stopManagedChild();
    },
    getStatus: () => status,
    onStatusChanged(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    async reconcile(config) {
      const currentGeneration = ++generation;
      if (disposed) return status;

      if (!config.autoStart) {
        await stopManagedChild();
        setStatus(createStatus("disabled", config.port));
        return status;
      }

      if (child && activePort === config.port) return status;
      await stopManagedChild();

      const probe = await probeBackend(config.port);
      if (currentGeneration !== generation || disposed) return status;
      if (probe.reachable) {
        setStatus(
          createStatus("running", config.port, {
            managed: false,
            source: "external",
          }),
        );
        options.log.info("[backend] using an existing backend at %s", backendOrigin(config.port));
        return status;
      }
      if (probe.occupied) {
        const error = `端口 ${config.port} 已被其他服务占用，无法启动本地后端。`;
        setStatus(createStatus("error", config.port, { error }));
        options.log.warn("[backend] %s", error);
        return status;
      }

      return startManagedChild(config.port, currentGeneration);
    },
  };
}
