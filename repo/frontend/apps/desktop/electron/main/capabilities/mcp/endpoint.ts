import { randomUUID } from "node:crypto";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

export interface McpEndpoint {
  close(): Promise<void>;
  getSessionCount(): number;
  handle(request: Request): Promise<Response>;
  sweep(): Promise<void>;
}

export interface CreateMcpEndpointOptions {
  createServer(): McpServer;
  maximumSessions?: number;
  now?(): number;
  sessionIdleMs?: number;
}

interface McpSession {
  lastUsedAtMs: number;
  server: McpServer;
  transport: WebStandardStreamableHTTPServerTransport;
}

const DEFAULT_MAXIMUM_SESSIONS = 8;
const DEFAULT_SESSION_IDLE_MS = 30 * 60 * 1_000;

/**
 * Owns stateful Streamable HTTP sessions. This is intentionally separate from
 * the HTTP listener: session rules are protocol rules and can be tested with
 * ordinary Web Request/Response objects.
 */
export function createMcpEndpoint(options: CreateMcpEndpointOptions): McpEndpoint {
  const maximumSessions = options.maximumSessions ?? DEFAULT_MAXIMUM_SESSIONS;
  const sessionIdleMs = options.sessionIdleMs ?? DEFAULT_SESSION_IDLE_MS;
  const now = options.now ?? Date.now;
  assertPositiveInteger(maximumSessions, "maximumSessions");
  assertPositiveInteger(sessionIdleMs, "sessionIdleMs");

  let closed = false;
  let pendingInitializations = 0;
  const initializingServers = new Set<McpServer>();
  const sessions = new Map<string, McpSession>();

  async function closeSession(sessionId: string) {
    const session = sessions.get(sessionId);
    if (!session) return;
    sessions.delete(sessionId);
    await session.server.close().catch(() => {
      // Bookkeeping is already removed. One broken SDK session must not block
      // endpoint shutdown or prevent a bounded replacement session.
    });
  }

  async function sweep() {
    const expirationMs = now() - sessionIdleMs;
    const expired = [...sessions.entries()]
      .filter(([, session]) => session.lastUsedAtMs < expirationMs)
      .map(([sessionId]) => sessionId);
    await Promise.all(expired.map(closeSession));
  }

  async function reserveInitializationSlot() {
    // Reserve synchronously before the first await. JavaScript requests can
    // interleave at await points, so checking capacity and incrementing in two
    // separate steps would allow concurrent initializes to exceed the cap.
    pendingInitializations += 1;
    while (sessions.size + pendingInitializations > maximumSessions) {
      const oldest = [...sessions.entries()].reduce<[string, McpSession] | null>(
        (current, candidate) =>
          !current || candidate[1].lastUsedAtMs < current[1].lastUsedAtMs ? candidate : current,
        null,
      );
      if (!oldest) {
        pendingInitializations -= 1;
        return false;
      }
      await closeSession(oldest[0]);
    }
    return true;
  }

  async function handle(request: Request): Promise<Response> {
    if (closed) return jsonRpcError(503, -32000, "MCP endpoint is closed");
    await sweep();
    if (closed) return jsonRpcError(503, -32000, "MCP endpoint is closed");

    const sessionId = request.headers.get("mcp-session-id");
    if (sessionId) return handleEstablishedSession(sessionId, request);
    return handleInitialization(request);
  }

  async function handleEstablishedSession(sessionId: string, request: Request): Promise<Response> {
    const session = sessions.get(sessionId);
    if (!session) return jsonRpcError(404, -32001, "MCP session not found");

    session.lastUsedAtMs = now();
    const response = await session.transport.handleRequest(request);
    if (request.method === "DELETE") await closeSession(sessionId);
    return response;
  }

  async function handleInitialization(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return jsonRpcError(400, -32000, "An MCP session must be initialized with POST");
    }

    const body = await request
      .clone()
      .json()
      .catch(() => null);
    if (!isInitializeRequest(body)) {
      return jsonRpcError(400, -32000, "An MCP initialize request is required");
    }

    if (!(await reserveInitializationSlot())) {
      return jsonRpcError(429, -32002, "MCP session capacity is busy");
    }
    let reservationActive = true;
    let server: McpServer | null = null;
    try {
      if (closed) return jsonRpcError(503, -32000, "MCP endpoint is closed");
      const createdServer = options.createServer();
      server = createdServer;
      initializingServers.add(createdServer);
      let initializedSessionId: string | null = null;
      let transport: WebStandardStreamableHTTPServerTransport;

      transport = new WebStandardStreamableHTTPServerTransport({
        enableJsonResponse: true,
        sessionIdGenerator: randomUUID,
        onsessioninitialized(sessionId) {
          if (reservationActive) {
            pendingInitializations -= 1;
            reservationActive = false;
          }
          initializedSessionId = sessionId;
          sessions.set(sessionId, {
            lastUsedAtMs: now(),
            server: createdServer,
            transport,
          });
        },
        onsessionclosed(sessionId) {
          // The SDK owns the protocol-side close. Remove only our bookkeeping;
          // calling server.close() from this callback would close twice.
          sessions.delete(sessionId);
        },
      });

      await createdServer.connect(transport);
      if (closed) {
        await createdServer.close();
        return jsonRpcError(503, -32000, "MCP endpoint is closed");
      }
      const response = await transport.handleRequest(request, { parsedBody: body });
      if (closed) {
        if (initializedSessionId) sessions.delete(initializedSessionId);
        await createdServer.close();
        return jsonRpcError(503, -32000, "MCP endpoint is closed");
      }
      if (!initializedSessionId) await createdServer.close();
      return response;
    } catch {
      await server?.close().catch(() => {});
      // A client already needs the local bearer credential, but protocol errors
      // still must not turn internal server details into an MCP response.
      return closed
        ? jsonRpcError(503, -32000, "MCP endpoint is closed")
        : jsonRpcError(500, -32603, "MCP initialization failed");
    } finally {
      if (server) initializingServers.delete(server);
      if (reservationActive) pendingInitializations -= 1;
    }
  }

  return {
    async close() {
      if (closed) return;
      closed = true;
      await Promise.allSettled([
        ...[...sessions.keys()].map(closeSession),
        ...[...initializingServers].map((server) => server.close()),
      ]);
    },
    getSessionCount() {
      return sessions.size;
    },
    handle,
    sweep,
  };
}

function jsonRpcError(status: number, code: number, message: string) {
  return Response.json(
    {
      error: { code, message },
      id: null,
      jsonrpc: "2.0",
    },
    { status },
  );
}

function assertPositiveInteger(value: number, name: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
}
