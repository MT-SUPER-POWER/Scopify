/**
 * Public, non-secret configuration for Scopify's loopback MCP server.
 *
 * The access token deliberately does not live in this structure: host settings
 * are rendered in the UI and written to YAML, while credentials are stored by
 * the Electron Main process using the platform's secure storage.
 */
export interface DesktopMcpConfig {
  capabilities: McpCapability[];
  enabled: boolean;
  port: number;
}

/** Capabilities are checked by the Main process for every tool invocation. */
export const MCP_CAPABILITY_VALUES = [
  // Coarse permission groups (backwards compatible)
  "playback.read",
  "playback.control",
  // Granular MCP inspection tools
  "playback.read.status",
  "playback.read.track",
  // Granular Gateway playback operations
  "playback.control.play",
  "playback.control.pause",
  "playback.control.toggle",
  "playback.control.next",
  "playback.control.previous",
  "playback.control.seek",
  "playback.control.volume",
] as const;

export type McpCapability = (typeof MCP_CAPABILITY_VALUES)[number];

export const MCP_PLAYBACK_CAPABILITIES = [
  "playback.read.status",
  "playback.read.track",
  "playback.control.play",
  "playback.control.pause",
  "playback.control.toggle",
  "playback.control.next",
  "playback.control.previous",
  "playback.control.seek",
  "playback.control.volume",
] as const satisfies readonly McpCapability[];

export const MCP_READ_CAPABILITIES = [
  "playback.read.status",
  "playback.read.track",
] as const satisfies readonly McpCapability[];

export const MCP_GATEWAY_CAPABILITIES = [
  "playback.control.play",
  "playback.control.pause",
  "playback.control.toggle",
  "playback.control.next",
  "playback.control.previous",
  "playback.control.seek",
  "playback.control.volume",
] as const satisfies readonly McpCapability[];

export const DEFAULT_DESKTOP_MCP_CONFIG = {
  capabilities: ["playback.read"],
  enabled: false,
  port: 31_927,
} as const satisfies DesktopMcpConfig;

/**
 * Runtime state safe to show in the Renderer. It intentionally carries no
 * credential, request body, source URL, local file path, or playback lyrics.
 */
export type McpStatus =
  | { enabled: false; port: null; state: "stopped" }
  | { enabled: true; port: number; state: "starting" }
  | { enabled: true; port: number; state: "listening" }
  | {
      enabled: true;
      error: { code: string; message: string };
      port: number;
      state: "error";
    };

/** A single MCP server entry formatted for standard mcp.json / Claude / Cursor configuration. */
export interface McpServerHttpConfig {
  headers: {
    Authorization: string;
  };
  type: "http";
  url: string;
}

/** Standard mcpServers bundle for one-click copy into mcp.json */
export interface McpClientConfiguration {
  mcpServers: {
    scopify: McpServerHttpConfig;
  };
}

/** Result of a real initialize + tools/list probe against the loopback server. */
export type McpConnectionTestResult =
  | {
      latencyMs: number;
      success: true;
      toolCount: number;
    }
  | {
      error: { code: string; message: string };
      latencyMs: number;
      success: false;
    };
