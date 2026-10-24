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
