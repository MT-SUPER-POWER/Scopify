import type {
  LogMetadata,
  LogValue,
  RendererLogEvent,
  RendererLogLevel,
  RendererTrackingEvent,
} from "@/types/logging";
import { runtime } from "@/lib/runtime";

const MAX_ARRAY_LENGTH = 20;
const MAX_DEPTH = 4;
const MAX_STRING_LENGTH = 2_000;
const SENSITIVE_KEY = /authorization|cookie|csrf|music_[a-z_]+|password|secret|token/i;
const SENSITIVE_COOKIE_VALUE =
  /(MUSIC_[A-Z_]+|__csrf|authorization|cookie|password|secret|token)=([^\s;&]+)/gi;

// Keep the original functions so console tracking cannot recursively track logger output.
const rawConsole = {
  debug: console.debug.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
};

function redactString(value: string) {
  return truncate(value.replace(SENSITIVE_COOKIE_VALUE, "$1=[REDACTED]"));
}

function truncate(value: string) {
  return value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`
    : value;
}

export function toLogValue(value: unknown, depth = 0, seen = new WeakSet<object>()): LogValue {
  if (value === null) return null;

  switch (typeof value) {
    case "boolean":
    case "number":
      return value;
    case "string":
      return redactString(value);
    case "undefined":
      return "undefined";
    case "bigint":
    case "symbol":
    case "function":
      return String(value);
  }

  if (value instanceof Error) {
    return {
      message: redactString(value.message),
      name: value.name,
      ...(value.stack ? { stack: redactString(value.stack) } : {}),
    };
  }

  if (depth >= MAX_DEPTH) return "[max-depth]";
  if (seen.has(value)) return "[circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map((item) => toLogValue(item, depth + 1, seen));
  }

  const metadata: LogMetadata = {};
  for (const [key, entry] of Object.entries(value)) {
    metadata[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : toLogValue(entry, depth + 1, seen);
  }
  return metadata;
}

function getMessage(args: unknown[]) {
  const [first] = args;
  if (typeof first === "string") {
    const suffix = args
      .slice(1)
      .filter((value): value is string => typeof value === "string")
      .join(" ");
    return redactString(suffix ? `${first} ${suffix}` : first);
  }
  if (first instanceof Error) return `${first.name}: ${redactString(first.message)}`;
  return JSON.stringify(toLogValue(first));
}

function toLogMetadata(value: unknown): LogMetadata {
  const normalized = toLogValue(value);
  if (typeof normalized === "object" && normalized !== null && !Array.isArray(normalized)) {
    return normalized;
  }
  return { value: normalized };
}

function createEventId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `renderer-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function writeToConsole(event: RendererLogEvent) {
  const args = event.metadata
    ? ["[renderer]", event.message, event.metadata]
    : ["[renderer]", event.message];
  if (event.level === "debug") rawConsole.debug(...args);
  else if (event.level === "info") rawConsole.info(...args);
  else if (event.level === "warn") rawConsole.warn(...args);
  else rawConsole.error(...args);
}

export function normalizeRendererLogEvent(input: RendererTrackingEvent): RendererLogEvent {
  return {
    event: input.event,
    id: createEventId(),
    level: input.level,
    message: redactString(input.message),
    ...(input.metadata === undefined ? {} : { metadata: toLogMetadata(input.metadata) }),
    source: input.source,
    timestamp: new Date().toISOString(),
    ...(input.traceId ? { traceId: input.traceId } : {}),
  };
}

function getWebDevRelayUrl() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return undefined;

  const port = Number(process.env.APP_CFG_DEBUG_LOG_RELAY_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) return undefined;
  return `http://${window.location.hostname}:${port}/events`;
}

function dispatch(event: RendererLogEvent) {
  if (typeof window === "undefined") return;

  void runtime.logging
    .write(event)
    .catch(() => false)
    .then((written) => {
      if (written) return;
      const relayUrl = getWebDevRelayUrl();
      if (!relayUrl) return;

      void fetch(relayUrl, {
        body: JSON.stringify(event),
        credentials: "omit",
        headers: { "content-type": "application/json" },
        keepalive: true,
        method: "POST",
      }).catch(() => undefined);
    });
}

function write(level: RendererLogLevel, args: unknown[]) {
  const event = normalizeRendererLogEvent({
    event: "app.log",
    level,
    message: getMessage(args),
    ...(args.length > 1 || typeof args[0] !== "string"
      ? { metadata: { details: args.map((arg) => toLogValue(arg)) } }
      : {}),
    source: "app",
  });
  writeToConsole(event);
  dispatch(event);
}

/** Emits one classified event to console plus the current runtime's structured sink. */
export function trackRendererEvent(input: RendererTrackingEvent) {
  const event = normalizeRendererLogEvent(input);
  if (event.source !== "console") writeToConsole(event);
  dispatch(event);
}

export const logger = {
  debug: (...args: unknown[]) => write("debug", args),
  error: (...args: unknown[]) => write("error", args),
  info: (...args: unknown[]) => write("info", args),
  warn: (...args: unknown[]) => write("warn", args),
};
