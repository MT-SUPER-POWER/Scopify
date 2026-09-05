import { createServer } from "node:net";
import { request as httpRequest } from "node:http";
import { createRequire } from "node:module";
import type { Server } from "node:http";
import type {
  DesktopBackendStatus,
  DesktopBackendState,
  DesktopHostConfig,
} from "@scopify/desktop-contract";
const RENDERER_SCHEME = "scopify";

const BACKEND_HOST = "127.0.0.1";
const BACKEND_PROBE_TIMEOUT_MS = 750;

const nodeRequire = createRequire(import.meta.url);

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
  restart(config: DesktopHostConfig["backend"]): Promise<DesktopBackendStatus>;
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

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, BACKEND_HOST, () => {
      const address = srv.address();
      if (!address || typeof address === "string") {
        srv.close(() => reject(new Error("Failed to allocate dynamic port")));
        return;
      }
      const port = address.port;
      srv.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
    srv.on("error", reject);
  });
}

async function stopServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
    } catch {
      // Ignore
    }
    server.close(() => resolve());
  });
}

async function startEmbeddedBackend(
  port: number,
  options: BackendControllerOptions,
): Promise<{ server: Server; port: number }> {
  const fs = nodeRequire("node:fs");
  const path = nodeRequire("node:path");
  const os = nodeRequire("node:os");

  const tmpPath = os.tmpdir();
  const tokenFile = path.resolve(tmpPath, "anonymous_token");
  if (!fs.existsSync(tokenFile)) {
    try {
      fs.writeFileSync(tokenFile, "", "utf-8");
    } catch {
      // Ignore
    }
  }

  try {
    const generateConfig = nodeRequire("@neteasecloudmusicapienhanced/api/generateConfig");
    if (typeof generateConfig === "function") {
      await generateConfig();
    }
  } catch (error) {
    options.log.warn("[backend] generateConfig failed (continuing anyway):", error);
  }

  process.env.CORS_ALLOW_ORIGIN = `${RENDERER_SCHEME}://-`;

  const { serveNcmApi } = nodeRequire("@neteasecloudmusicapienhanced/api/server");
  const appExt = await serveNcmApi({
    checkVersion: false,
    host: BACKEND_HOST,
    port,
  });

  if (!appExt?.server) {
    throw new Error("Failed to initialize backend HTTP server instance");
  }

  const server = appExt.server as Server;

  return new Promise<{ server: Server; port: number }>((resolve, reject) => {
    if (server.listening) {
      resolve({ server, port });
      return;
    }

    const onError = (err: Error) => {
      server.removeListener("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      resolve({ server, port });
    };

    server.once("error", onError);
    server.once("listening", onListening);
  });
}

export function createDesktopBackendController(
  options: BackendControllerOptions,
  initialConfig: DesktopHostConfig["backend"],
): DesktopBackendController {
  let status = createStatus(initialConfig.autoStart ? "stopped" : "disabled", initialConfig.port);
  let activeServer: Server | null = null;
  let activePort: number | null = null;
  let generation = 0;
  let disposed = false;
  const listeners = new Set<(nextStatus: DesktopBackendStatus) => void>();

  const setStatus = (nextStatus: DesktopBackendStatus) => {
    status = nextStatus;
    listeners.forEach((listener) => listener(status));
  };

  const stopManagedServer = async () => {
    const currentServer = activeServer;
    activeServer = null;
    activePort = null;
    if (!currentServer) return;
    setStatus(createStatus("stopped", status.port));
    await stopServer(currentServer);
  };

  const startManaged = async (preferredPort: number, currentGeneration: number) => {
    setStatus(createStatus("starting", preferredPort, { managed: true, source: "managed" }));

    try {
      let targetPort = preferredPort;
      if (!targetPort || targetPort <= 0) {
        targetPort = await getFreePort();
      }
      const probe = await probeBackend(targetPort);
      if (probe.occupied) {
        options.log.warn(`[backend] 目标端口 ${targetPort} 已被占用，正在分配空闲端口...`);
        targetPort = await getFreePort();
      }

      if (currentGeneration !== generation || disposed) return status;

      let started: { server: Server; port: number };
      try {
        started = await startEmbeddedBackend(targetPort, options);
      } catch (err) {
        options.log.warn(`[backend] 端口 ${targetPort} 启动失败，尝试动态分配空闲端口...`, err);
        targetPort = await getFreePort();
        started = await startEmbeddedBackend(targetPort, options);
      }

      if (currentGeneration !== generation || disposed) {
        await stopServer(started.server);
        return status;
      }

      activeServer = started.server;
      activePort = started.port;

      setStatus(
        createStatus("running", started.port, {
          managed: true,
          pid: process.pid,
          source: "managed",
        }),
      );
      options.log.info(
        "[backend] local embedded backend is ready at %s",
        backendOrigin(started.port),
      );
      return status;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      options.log.error("[backend] failed to start embedded backend:", error);
      setStatus(createStatus("error", preferredPort, { error: message }));
      return status;
    }
  };

  return {
    async dispose() {
      disposed = true;
      generation += 1;
      await stopManagedServer();
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
        await stopManagedServer();
        setStatus(createStatus("disabled", config.port));
        return status;
      }

      if (activeServer && activePort !== null) {
        return status;
      }
      await stopManagedServer();

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

      return startManaged(config.port, currentGeneration);
    },
    async restart(config) {
      const currentGeneration = ++generation;
      if (disposed) return status;
      if (!config.autoStart) {
        await stopManagedServer();
        setStatus(createStatus("disabled", config.port));
        return status;
      }

      await stopManagedServer();
      const probe = await probeBackend(config.port);
      if (currentGeneration !== generation || disposed) return status;
      if (probe.reachable) {
        setStatus(
          createStatus("running", config.port, {
            managed: false,
            source: "external",
          }),
        );
        return status;
      }
      return startManaged(config.port, currentGeneration);
    },
  };
}
