import type { McpAuthorization } from "@/types/service/mcp/authorization";
export type { McpAuthorization } from "@/types/service/mcp/authorization";
import type { McpCapability } from "@scopify/desktop-contract";

export function createMcpAuthorization(capabilities: readonly McpCapability[]): McpAuthorization {
  const allowed = new Set(capabilities);

  return {
    allows(capability) {
      if (allowed.has(capability)) return true;

      // Coarse groups inherit to granular operations
      if (capability.startsWith("playback.read.") && allowed.has("playback.read")) {
        return true;
      }
      if (capability.startsWith("playback.control.") && allowed.has("playback.control")) {
        return true;
      }

      // Checking coarse groups succeeds if any granular child is granted
      if (capability === "playback.read") {
        return allowed.has("playback.read.status") || allowed.has("playback.read.track");
      }
      if (capability === "playback.control") {
        return (
          allowed.has("playback.control.play") ||
          allowed.has("playback.control.pause") ||
          allowed.has("playback.control.toggle") ||
          allowed.has("playback.control.next") ||
          allowed.has("playback.control.previous") ||
          allowed.has("playback.control.seek") ||
          allowed.has("playback.control.volume")
        );
      }

      return false;
    },
  };
}
