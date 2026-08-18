import { sanitizeLogText } from "../logging.js";

/** Formats one child-process output chunk without flattening multiline messages. */
export function formatBackendChildOutput(value: Buffer) {
  return sanitizeLogText(value.toString("utf8"))
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim()
    .slice(0, 500);
}

/** Keeps the backend scope label separate from multiline startup banners. */
export function formatBackendLogEntry(message: string) {
  return message.includes("\n") ? `[backend]\n${message}` : `[backend] ${message}`;
}
