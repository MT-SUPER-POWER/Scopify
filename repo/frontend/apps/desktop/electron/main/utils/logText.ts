const ANSI_ESCAPE_SEQUENCE_PATTERN =
  /(?:\u001B\][\s\S]*?(?:\u0007|\u001B\\)|\u001B\[[0-?]*[ -/]*[@-~]|\u001B[@-_])/g;

/** Removes terminal controls and normalizes carriage-return progress output. */
export function sanitizeLogText(text: string): string {
  return text.replace(ANSI_ESCAPE_SEQUENCE_PATTERN, "").replace(/\r\n?/g, "\n");
}

/** Applies terminal sanitization without changing structured log values. */
export function sanitizeLogData(data: unknown): unknown {
  if (typeof data === "string") return sanitizeLogText(data);
  if (Array.isArray(data)) {
    return data.map((item) => (typeof item === "string" ? sanitizeLogText(item) : item));
  }
  return data;
}
