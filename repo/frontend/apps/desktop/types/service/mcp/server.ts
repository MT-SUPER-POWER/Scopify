import type { McpAuditLog } from "@/types/service/mcp/audit";
import type { McpPlaybackToolFacade } from "@/types/service/mcp/tools/playback";
export interface CreateScopifyMcpServerOptions {
  audit: McpAuditLog;
  playback: McpPlaybackToolFacade;
  version: string;
}
