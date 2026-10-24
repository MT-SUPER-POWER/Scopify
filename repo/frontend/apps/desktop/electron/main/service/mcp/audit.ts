import type { McpAuditEntry, McpAuditLog } from "@/types/service/mcp/audit";
export type { McpAuditEntry, McpAuditLog } from "@/types/service/mcp/audit";

export function createMcpAuditLog(maximumEntries = 100): McpAuditLog {
  if (!Number.isInteger(maximumEntries) || maximumEntries <= 0) {
    throw new RangeError("maximumEntries must be a positive integer.");
  }

  const entries: McpAuditEntry[] = [];

  return {
    record(entry) {
      entries.push({ ...entry });
      if (entries.length > maximumEntries) entries.splice(0, entries.length - maximumEntries);
    },
    snapshot() {
      return entries.map((entry) => ({ ...entry }));
    },
  };
}
