import { describe, expect, test } from "bun:test";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpEndpoint } from "@main/capabilities/mcp/endpoint";

const initializeBody = {
  id: 1,
  jsonrpc: "2.0",
  method: "initialize",
  params: {
    capabilities: {},
    clientInfo: { name: "scopify-test", version: "1.0" },
    protocolVersion: "2025-11-25",
  },
};

function initializeRequest() {
  return new Request("http://127.0.0.1/mcp", {
    body: JSON.stringify(initializeBody),
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    method: "POST",
  });
}

describe("MCP Streamable HTTP endpoint", () => {
  test("requires initialize before allocating a session", async () => {
    const endpoint = createMcpEndpoint({
      createServer: () => new McpServer({ name: "test", version: "1.0" }),
    });

    const response = await endpoint.handle(new Request("http://127.0.0.1/mcp", { method: "POST" }));

    expect(response.status).toBe(400);
    expect(endpoint.getSessionCount()).toBe(0);
    await endpoint.close();
  });

  test("creates, bounds, and deletes stateful sessions", async () => {
    const endpoint = createMcpEndpoint({
      createServer: () => new McpServer({ name: "test", version: "1.0" }),
      maximumSessions: 1,
    });

    const first = await endpoint.handle(initializeRequest());
    const firstId = first.headers.get("mcp-session-id");
    expect(first.status).toBe(200);
    expect(firstId).toBeString();
    expect(endpoint.getSessionCount()).toBe(1);

    const second = await endpoint.handle(initializeRequest());
    const secondId = second.headers.get("mcp-session-id");
    expect(second.status).toBe(200);
    expect(secondId).toBeString();
    expect(secondId).not.toBe(firstId);
    expect(endpoint.getSessionCount()).toBe(1);

    const stale = await endpoint.handle(
      new Request("http://127.0.0.1/mcp", {
        headers: { "mcp-session-id": firstId! },
        method: "DELETE",
      }),
    );
    expect(stale.status).toBe(404);

    const removed = await endpoint.handle(
      new Request("http://127.0.0.1/mcp", {
        headers: { "mcp-session-id": secondId! },
        method: "DELETE",
      }),
    );
    expect(removed.status).toBe(200);
    expect(endpoint.getSessionCount()).toBe(0);
    await endpoint.close();
  });

  test("evicts idle sessions before serving a new request", async () => {
    let now = 1_000;
    const endpoint = createMcpEndpoint({
      createServer: () => new McpServer({ name: "test", version: "1.0" }),
      now: () => now,
      sessionIdleMs: 100,
    });

    await endpoint.handle(initializeRequest());
    expect(endpoint.getSessionCount()).toBe(1);
    now = 1_101;
    await endpoint.sweep();
    expect(endpoint.getSessionCount()).toBe(0);
    await endpoint.close();
  });

  test("counts in-flight initializations atomically against the session limit", async () => {
    let releaseFirst!: () => void;
    let markFirstStarted!: () => void;
    const firstStarted = new Promise<void>((resolve) => {
      markFirstStarted = resolve;
    });
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let serverNumber = 0;
    const endpoint = createMcpEndpoint({
      maximumSessions: 1,
      createServer: () => {
        const server = new McpServer({ name: "test", version: "1.0" });
        serverNumber += 1;
        if (serverNumber === 1) {
          const connect = server.connect.bind(server);
          server.connect = async (transport) => {
            markFirstStarted();
            await firstGate;
            await connect(transport);
          };
        }
        return server;
      },
    });

    const first = endpoint.handle(initializeRequest());
    await firstStarted;
    const rejected = await endpoint.handle(initializeRequest());
    expect(rejected.status).toBe(429);
    expect(endpoint.getSessionCount()).toBe(0);

    releaseFirst();
    expect((await first).status).toBe(200);
    expect(endpoint.getSessionCount()).toBe(1);
    await endpoint.close();
  });

  test("closes a server that finishes initialization during endpoint shutdown", async () => {
    let releaseConnect!: () => void;
    let markConnectStarted!: () => void;
    const connectStarted = new Promise<void>((resolve) => {
      markConnectStarted = resolve;
    });
    const connectGate = new Promise<void>((resolve) => {
      releaseConnect = resolve;
    });
    const endpoint = createMcpEndpoint({
      createServer: () => {
        const server = new McpServer({ name: "test", version: "1.0" });
        const connect = server.connect.bind(server);
        server.connect = async (transport) => {
          markConnectStarted();
          await connectGate;
          await connect(transport);
        };
        return server;
      },
    });

    const initializing = endpoint.handle(initializeRequest());
    await connectStarted;
    const closing = endpoint.close();
    releaseConnect();

    expect((await initializing).status).toBe(503);
    await closing;
    expect(endpoint.getSessionCount()).toBe(0);
  });
});
