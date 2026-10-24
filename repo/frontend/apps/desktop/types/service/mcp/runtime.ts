import type {
  DesktopMcpConfig,
  McpClientConfiguration,
  McpConnectionTestResult,
  McpStatus,
} from "@scopify/desktop-contract";
import type { PlaybackGateway } from "@/types/service/playback/gateway";
import type { McpAuditLog } from "@/types/service/mcp/audit";
import type { McpCredentialStore } from "@/types/service/mcp/credentialStore";
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
