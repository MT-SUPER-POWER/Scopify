import type { McpEndpoint } from "@/types/service/mcp/endpoint";
import type { McpCredentialStore } from "@/types/service/mcp/credentialStore";
export interface McpHttpServer {
  close(): Promise<void>;
  listen(port: number): Promise<number>;
}

export interface CreateMcpHttpServerOptions {
  credentials: McpCredentialStore;
  endpoint: McpEndpoint;
  maximumBodyBytes?: number;
}
