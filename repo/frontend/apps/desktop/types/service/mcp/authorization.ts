import type { McpCapability } from "@scopify/desktop-contract";
/**
 * The MCP tool annotations are documentation for an AI client, not an access
 * control mechanism. Main process code checks this policy for every call.
 */
export interface McpAuthorization {
  allows(capability: McpCapability): boolean;
}
