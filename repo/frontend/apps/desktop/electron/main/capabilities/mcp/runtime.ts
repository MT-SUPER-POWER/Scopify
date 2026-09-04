import type {
  DesktopMcpConfig,
  McpClientConfiguration,
  McpConnectionTestResult,
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
  getClientConfiguration(): Promise<McpClientConfiguration>;
  getStatus(): McpStatus;
  restart(): Promise<McpStatus>;
  rotateCredential(): Promise<McpClientConfiguration>;
  start(config: DesktopMcpConfig): Promise<McpStatus>;
  stop(): Promise<void>;
  subscribe(listener: (status: McpStatus) => void): () => void;
  testConnection(): Promise<McpConnectionTestResult>;
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
    getClientConfiguration() {
      return enqueue(async () => {
        const port = configuredPort(activeConfig, status);
        const token = await credentials.getOrCreate();
        return clientConfiguration(token, port);
      });
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
        const port = configuredPort(activeConfig, status);
        const token = await credentials.rotate();
        return clientConfiguration(token, port);
      });
    },
    start(config) {
      return enqueue(() => startInternal(config));
    },
    stop() {
      return enqueue(stopInternal);
    },
    subscribe,
    testConnection() {
      return enqueue(async () => {
        const current = getStatus();
        if (current.state !== "listening") {
          return {
            error: { code: "MCP_NOT_LISTENING", message: "MCP is not listening." },
            latencyMs: 0,
            success: false,
          };
        }
        return testLoopbackConnection(
          `http://127.0.0.1:${current.port}/mcp`,
          await credentials.getOrCreate(),
        );
      });
    },
  };
}

function configuredPort(config: DesktopMcpConfig | null, status: McpStatus) {
  if (status.state === "listening" || status.state === "starting" || status.state === "error") {
    return status.port;
  }
  if (config) return config.port;
  throw new Error("MCP has not been configured yet.");
}

function clientConfiguration(token: string, port: number): McpClientConfiguration {
  return {
    mcpServers: {
      scopify: {
        headers: { Authorization: `Bearer ${token}` },
        type: "http",
        url: `http://127.0.0.1:${port}/mcp`,
      },
    },
  };
}

const MCP_PROTOCOL_VERSION = "2025-11-25";

async function testLoopbackConnection(
  url: string,
  token: string,
): Promise<McpConnectionTestResult> {
  const startedAtMs = Date.now();
  const signal = AbortSignal.timeout(5_000);
  let sessionId: string | null = null;
  const baseHeaders = {
    accept: "application/json, text/event-stream",
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };

  try {
    const initialized = await fetch(url, {
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          capabilities: {},
          clientInfo: { name: "scopify-settings", version: "1.0" },
          protocolVersion: MCP_PROTOCOL_VERSION,
        },
      }),
      headers: baseHeaders,
      method: "POST",
      signal,
    });
    sessionId = initialized.headers.get("mcp-session-id");
    if (!initialized.ok || !sessionId) throw new Error("initialize-failed");

    const sessionHeaders = {
      ...baseHeaders,
      "mcp-protocol-version": MCP_PROTOCOL_VERSION,
      "mcp-session-id": sessionId,
    };
    const acknowledged = await fetch(url, {
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      headers: sessionHeaders,
      method: "POST",
      signal,
    });
    if (!acknowledged.ok) throw new Error("initialized-notification-failed");

    const listed = await fetch(url, {
      body: JSON.stringify({ id: 2, jsonrpc: "2.0", method: "tools/list", params: {} }),
      headers: sessionHeaders,
      method: "POST",
      signal,
    });
    const body = (await listed.json().catch(() => null)) as {
      result?: { tools?: unknown[] };
    } | null;
    if (!listed.ok || !Array.isArray(body?.result?.tools)) throw new Error("tools-list-failed");

    return {
      latencyMs: Math.max(0, Date.now() - startedAtMs),
      success: true,
      toolCount: body.result.tools.length,
    };
  } catch {
    return {
      error: { code: "MCP_CONNECTION_FAILED", message: "MCP connection test failed." },
      latencyMs: Math.max(0, Date.now() - startedAtMs),
      success: false,
    };
  } finally {
    if (sessionId) {
      await fetch(url, {
        headers: {
          ...baseHeaders,
          "mcp-protocol-version": MCP_PROTOCOL_VERSION,
          "mcp-session-id": sessionId,
        },
        method: "DELETE",
      }).catch(() => {});
    }
  }
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
