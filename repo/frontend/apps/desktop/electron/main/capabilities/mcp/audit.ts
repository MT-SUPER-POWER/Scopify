/**
 * Deliberately small audit record. Do not add token, URL, path, request body,
 * lyrics, or arbitrary tool arguments here: this can be persisted or exposed
 * in a future settings screen.
 */
export interface McpAuditEntry {
  durationMs: number;
  outcome: "accepted" | "rejected" | "unavailable";
  timestampMs: number;
  tool: string;
}

export interface McpAuditLog {
  record(entry: McpAuditEntry): void;
  snapshot(): readonly McpAuditEntry[];
}

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
