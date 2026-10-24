import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
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

export interface McpSession {
  lastUsedAtMs: number;
  server: McpServer;
  transport: WebStandardStreamableHTTPServerTransport;
}
