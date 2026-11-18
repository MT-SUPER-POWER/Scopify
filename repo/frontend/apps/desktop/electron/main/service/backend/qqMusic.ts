import { existsSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { app, utilityProcess, type UtilityProcess } from "electron";
import type {
  DesktopBackendConfig,
  DesktopBackendState,
  DesktopBackendStatus,
} from "@scopify/desktop-contract";
import type {
  BackendControllerOptions,
  BackendProbeResult,
  DesktopBackendController,
} from "@/types/service/backend";
import { publicAsset } from "@main/constants";
import { getFreePort } from "./index";

const QQ_HOST = "127.0.0.1";
const QQ_PACKAGE = "@yakult-green-tea/qq-music-api";
const PROBE_TIMEOUT_MS = 750;
const STARTUP_TIMEOUT_MS = 20_000;
const STARTUP_POLL_MS = 250;

const nodeRequire = createRequire(import.meta.url);

/** Installers do not ship the QQ Music API yet; that is a missing feature, not a failure. */
class QqBackendUnavailableError extends Error {}

interface QqLaunch {
  args: string[];
  cwd: string;
}

function origin(port: number) {
  return `http://${QQ_HOST}:${port}`;
}

function createStatus(
  state: DesktopBackendState,
  port: number,
  overrides: Partial<DesktopBackendStatus> = {},
): DesktopBackendStatus {
  return {
    error: null,
    host: QQ_HOST,
    managed: false,
    origin: origin(port),
    pid: null,
    port,
    source: null,
    state,
    ...overrides,
  };
}

/** `/login/channels` answers without a session, so it doubles as the health check. */
function probeQqBackend(port: number): Promise<BackendProbeResult> {
  return new Promise((resolveProbe) => {
    let settled = false;
    const finish = (result: BackendProbeResult) => {
      if (settled) return;
      settled = true;
      resolveProbe(result);
    };

    const request = httpRequest(
      { hostname: QQ_HOST, method: "GET", path: "/login/channels", port },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.once("end", () => {
          let healthy = false;
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
              code?: unknown;
            };
            healthy = payload?.code === 200;
          } catch {
            // A non-JSON response still proves that another process owns the port.
          }
          finish({ occupied: true, reachable: response.statusCode === 200 && healthy });
        });
      },
    );
    request.setTimeout(PROBE_TIMEOUT_MS, () => {
      request.destroy();
      finish({ occupied: true, reachable: false });
    });
    request.once("error", (error: NodeJS.ErrnoException) => {
      finish({ occupied: error.code !== "ECONNREFUSED", reachable: false });
    });
    request.end();
  });
}

/**
 * Prefer the published build; a source checkout without `dist` runs the TypeScript entry through
 * ts-node, exactly like the package's own `npm start`. Installers do not ship the API yet.
 */
function resolveQqLaunch(): QqLaunch {
  let packageJson: string;
  try {
    packageJson = nodeRequire.resolve(`${QQ_PACKAGE}/package.json`);
  } catch {
    throw new QqBackendUnavailableError("QQ Music API is not bundled with this build.");
  }
  const root = dirname(packageJson);
  const host = publicAsset("backend", "qq-music-host.cjs");

  const built = join(root, "dist", "src", "app.js");
  if (existsSync(built)) return { args: [host, built], cwd: root };

  const source = join(root, "src", "app.ts");
  if (!existsSync(source)) throw new Error("QQ Music API has neither a build nor sources.");
  const register = createRequire(packageJson).resolve("ts-node/register/transpile-only");
  return { args: [host, source, register], cwd: root };
}

function waitForExitOrReady(child: UtilityProcess, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + STARTUP_TIMEOUT_MS;
    let done = false;
    const onExit = (code: number) => {
      done = true;
      reject(new Error(`QQ Music API exited during startup (code ${code}).`));
    };
    child.once("exit", onExit);

    const poll = async () => {
      if (done) return;
      const probe = await probeQqBackend(port);
      if (done) return;
      if (probe.reachable) {
        done = true;
        child.removeListener("exit", onExit);
        resolve();
        return;
      }
      if (Date.now() > deadline) {
        done = true;
        child.removeListener("exit", onExit);
        reject(new Error("QQ Music API did not become ready in time."));
        return;
      }
      setTimeout(() => void poll(), STARTUP_POLL_MS);
    };
    void poll();
  });
}

function stopChild(child: UtilityProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.pid === undefined) {
      resolve();
      return;
    }
    child.once("exit", () => resolve());
    child.kill();
  });
}

/**
 * The QQ Music API starts listening as an import side effect and cannot be loaded twice in one
 * process, so it runs in its own utility process: a restart replaces the process.
 */
export function createQqMusicBackendController(
  options: BackendControllerOptions,
  initialConfig: DesktopBackendConfig,
): DesktopBackendController {
  let status = createStatus(initialConfig.autoStart ? "stopped" : "disabled", initialConfig.port);
  let child: UtilityProcess | null = null;
  // The configured port; the running one may differ when it was occupied at startup.
  let requestedPort = initialConfig.port;
  let generation = 0;
  let disposed = false;
  const listeners = new Set<(nextStatus: DesktopBackendStatus) => void>();

  const setStatus = (nextStatus: DesktopBackendStatus) => {
    status = nextStatus;
    listeners.forEach((listener) => listener(status));
  };

  const stopManaged = async () => {
    const current = child;
    child = null;
    if (!current) return;
    setStatus(createStatus("stopped", status.port));
    await stopChild(current);
  };

  const startManaged = async (preferredPort: number, currentGeneration: number) => {
    requestedPort = preferredPort;
    setStatus(createStatus("starting", preferredPort, { managed: true, source: "managed" }));
    try {
      let port = preferredPort;
      if ((await probeQqBackend(port)).occupied) {
        options.log.warn(`[qq-backend] 端口 ${port} 已被占用，正在分配空闲端口...`);
        port = await getFreePort();
      }
      if (currentGeneration !== generation || disposed) return status;

      const launch = resolveQqLaunch();
      const next = utilityProcess.fork(launch.args[0], launch.args.slice(1), {
        cwd: launch.cwd,
        env: {
          ...process.env,
          PORT: String(port),
          // Reusing one device identity avoids QQ's per-account device limit (error 20279).
          QQ_AUTH_STATE_PATH: join(app.getPath("userData"), "qq-music-api", "qq-device.json"),
        },
        serviceName: "QQ Music API",
        stdio: "pipe",
      });
      next.stderr?.on("data", (chunk: Buffer) => {
        options.log.warn("[qq-backend]", chunk.toString("utf8").trimEnd());
      });
      child = next;

      await waitForExitOrReady(next, port);
      if (currentGeneration !== generation || disposed) {
        if (child === next) child = null;
        await stopChild(next);
        return status;
      }

      next.once("exit", (code) => {
        if (child !== next) return;
        child = null;
        options.log.error(`[qq-backend] process exited unexpectedly (code ${code})`);
        setStatus(createStatus("error", port, { error: `exited with code ${code}` }));
      });
      setStatus(
        createStatus("running", port, { managed: true, pid: next.pid ?? null, source: "managed" }),
      );
      options.log.info("[qq-backend] QQ Music API is ready at %s", origin(port));
      return status;
    } catch (error) {
      const failed = child;
      child = null;
      if (failed) await stopChild(failed);
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof QqBackendUnavailableError) {
        options.log.info("[qq-backend]", message);
        setStatus(createStatus("disabled", preferredPort, { error: message }));
        return status;
      }
      options.log.error("[qq-backend] failed to start QQ Music API:", error);
      setStatus(createStatus("error", preferredPort, { error: message }));
      return status;
    }
  };

  const ensure = async (config: DesktopBackendConfig, currentGeneration: number) => {
    if (!config.autoStart) {
      await stopManaged();
      setStatus(createStatus("disabled", config.port));
      return status;
    }
    const probe = await probeQqBackend(config.port);
    if (currentGeneration !== generation || disposed) return status;
    if (probe.reachable) {
      setStatus(createStatus("running", config.port, { source: "external" }));
      options.log.info("[qq-backend] using an existing QQ Music API at %s", origin(config.port));
      return status;
    }
    return startManaged(config.port, currentGeneration);
  };

  return {
    async dispose() {
      disposed = true;
      generation += 1;
      await stopManaged();
    },
    getStatus: () => status,
    onStatusChanged(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    async reconcile(config) {
      const currentGeneration = ++generation;
      if (disposed) return status;
      if (config.autoStart && child && requestedPort === config.port) return status;
      await stopManaged();
      return ensure(config, currentGeneration);
    },
    async restart(config) {
      const currentGeneration = ++generation;
      if (disposed) return status;
      await stopManaged();
      return ensure(config, currentGeneration);
    },
  };
}
