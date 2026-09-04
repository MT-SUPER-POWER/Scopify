import type {
  DesktopMcpConfig,
  McpClientConfiguration,
  McpStatus,
} from "@scopify/desktop-contract";

import type { PlaybackGateway } from "@main/capabilities/playbackGateway";

import { createMcpAuditLog, type McpAuditLog } from "./audit";
import { createMcpAuthorization } from "./authorization";
import { createMcpCredentialStore, type McpCredentialStore } from "./credentialStore";
import { createMcpEndpoint, type McpEndpoint } from "./endpoint";
import { createMcpHttpServer, type McpHttpServer } from "./http";
import { createScopifyMcpServer } from "./server";
import { createMcpPlaybackToolFacade } from "./tools/playback";

export interface McpRuntime {
  configure(config: DesktopMcpConfig): Promise<McpStatus>;
  dispose(): Promise<void>;
  getAuditLog(): McpAuditLog;
  getStatus(): McpStatus;
  restart(): Promise<McpStatus>;
  rotateCredential(): Promise<McpClientConfiguration>;
  start(config: DesktopMcpConfig): Promise<McpStatus>;
  stop(): Promise<void>;
  subscribe(listener: (status: McpStatus) => void): () => void;
}

export interface CreateMcpRuntimeOptions {
  auditLog?: McpAuditLog;
  credentials?: McpCredentialStore;
  playback: PlaybackGateway;
  version: string;
}

/**
 * Process-lifetime MCP composition root. It owns the server and endpoint
 * lifecycle but does not read configuration files or talk to IPC; those are
 * adapters above this capability.
 */
export function createMcpRuntime(options: CreateMcpRuntimeOptions): McpRuntime {
  const credentials = options.credentials ?? createMcpCredentialStore();
  const auditLog = options.auditLog ?? createMcpAuditLog();
  const listeners = new Set<(status: McpStatus) => void>();

  let activeConfig: DesktopMcpConfig | null = null;
  let endpoint: McpEndpoint | null = null;
  let httpServer: McpHttpServer | null = null;
  let status: McpStatus = { enabled: false, port: null, state: "stopped" };
  let serializedOperation: Promise<unknown> = Promise.resolve();

  function getStatus() {
    return cloneStatus(status);
  }

  function subscribe(listener: (next: McpStatus) => void) {
    listeners.add(listener);
    return once(() => listeners.delete(listener));
  }

  function publish(next: McpStatus) {
    status = cloneStatus(next);
    for (const listener of [...listeners]) {
      try {
        listener(getStatus());
      } catch {
        // Status subscribers are UI observers; they cannot interrupt server lifecycle work.
      }
    }
  }

  function enqueue<T>(operation: () => Promise<T>) {
    const next = serializedOperation.then(operation, operation);
    serializedOperation = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  async function startInternal(config: DesktopMcpConfig): Promise<McpStatus> {
    const normalized = cloneConfig(config);
    activeConfig = normalized;
    if (!normalized.enabled) {
      await stopInternal();
      return getStatus();
    }
    if (httpServer) return getStatus();

    publish({ enabled: true, port: normalized.port, state: "starting" });
    try {
      // Create and persist the credential before the listener appears. This
      // avoids a server which looks healthy but cannot authenticate its first
      // request because OS secure storage is unavailable.
      await credentials.getOrCreate();
      endpoint = createMcpEndpoint({
        createServer: () => {
          const authorization = createMcpAuthorization(normalized.capabilities);
          const playback = createMcpPlaybackToolFacade(options.playback, authorization);
          return createScopifyMcpServer({ audit: auditLog, playback, version: options.version });
        },
      });
      httpServer = createMcpHttpServer({ credentials, endpoint });
      const listeningPort = await httpServer.listen(normalized.port);
      publish({ enabled: true, port: listeningPort, state: "listening" });
    } catch (error) {
      await closeActiveServer();
      publish({
        enabled: true,
        error: errorDetails(error),
        port: normalized.port,
        state: "error",
      });
    }
    return getStatus();
  }

  async function stopInternal() {
    await closeActiveServer();
    publish({ enabled: false, port: null, state: "stopped" });
  }

  async function closeActiveServer() {
    const activeHttpServer = httpServer;
    const activeEndpoint = endpoint;
    httpServer = null;
    endpoint = null;
    await Promise.allSettled([activeHttpServer?.close(), activeEndpoint?.close()]);
  }

  return {
    configure(config) {
      return enqueue(async () => {
        await stopInternal();
        return startInternal(config);
      });
    },
    dispose() {
      return enqueue(async () => {
        await stopInternal();
        listeners.clear();
      });
    },
    getAuditLog() {
      return auditLog;
    },
    getStatus,
    restart() {
      return enqueue(async () => {
        if (!activeConfig) return getStatus();
        await stopInternal();
        return startInternal(activeConfig);
      });
    },
    rotateCredential() {
      return enqueue(async () => {
        const current = getStatus();
        if (current.state !== "listening") {
          throw new Error("MCP must be listening before a client configuration can be created.");
        }
        const token = await credentials.rotate();
        // This raw bearer token is returned only from the explicit rotation
        // action. It is not retained in status, audit records, or host config.
        return {
          headers: { Authorization: `Bearer ${token}` },
          transport: "streamable-http",
          url: `http://127.0.0.1:${current.port}/mcp`,
        };
      });
    },
    start(config) {
      return enqueue(() => startInternal(config));
    },
    stop() {
      return enqueue(stopInternal);
    },
    subscribe,
  };
}

function cloneConfig(config: DesktopMcpConfig): DesktopMcpConfig {
  return {
    capabilities: [...config.capabilities],
    enabled: config.enabled,
    port: config.port,
  };
}

function cloneStatus(value: McpStatus): McpStatus {
  return value.state === "error" ? { ...value, error: { ...value.error } } : { ...value };
}

function errorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      code:
        typeof (error as NodeJS.ErrnoException).code === "string"
          ? (error as NodeJS.ErrnoException).code!
          : "MCP_LISTEN_FAILED",
      message: error.message,
    };
  }
  return { code: "MCP_LISTEN_FAILED", message: "MCP failed to start." };
}

function once(action: () => void) {
  let invoked = false;
  return () => {
    if (invoked) return;
    invoked = true;
    action();
  };
}
