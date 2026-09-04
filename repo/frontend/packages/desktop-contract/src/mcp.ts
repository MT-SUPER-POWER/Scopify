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
export type McpCapability = "playback.read" | "playback.control";

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

/** A one-time credential reveal returned only after an explicit user action. */
export interface McpClientConfiguration {
  headers: {
    Authorization: string;
  };
  transport: "streamable-http";
  url: string;
}
