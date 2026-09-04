import { isApiError } from "@/lib/web/apiError";
import { runtime } from "@/lib/runtime";
import { writeNativeRendererConsoleError } from "@/lib/runtime/consoleBridge";
import type { LogMetadata, LogValue, RendererLogSource } from "@/types/logging";

const MAX_ARRAY_LENGTH = 20;
const MAX_DEPTH = 4;
const MAX_STRING_LENGTH = 2_000;
const SENSITIVE_KEY = /authorization|cookie|csrf|music_[a-z_]+|password|secret|token/i;
const SENSITIVE_COOKIE_VALUE =
  /(MUSIC_[A-Z_]+|__csrf|authorization|cookie|password|secret|token)=([^\s;&]+)/gi;

interface FailureTrackingInput {
  context?: unknown;
  error: unknown;
  event: string;
  message: string;
  source: RendererLogSource;
}

function redactString(value: string) {
  return truncate(value.replace(SENSITIVE_COOKIE_VALUE, "$1=[REDACTED]"));
}

function truncate(value: string) {
  return value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`
    : value;
}

function toMetadata(value: unknown, depth = 0, seen = new WeakSet<object>()): LogValue {
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
  if (seen.has(value as object)) return "[circular]";
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).map((entry) => toMetadata(entry, depth + 1, seen));
  }

  const metadata: LogMetadata = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    metadata[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : toMetadata(entry, depth + 1, seen);
  }
  return metadata;
}

function createEventId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `renderer-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function writeFailureEvent(
  event: string,
  message: string,
  source: RendererLogSource,
  metadata: unknown,
  traceId: string | undefined,
) {
  void runtime.logging
    .write({
      event,
      id: createEventId(),
      level: "error",
      message: redactString(message),
      metadata:
        typeof metadata === "object" && metadata !== null
          ? (toMetadata(metadata) as LogMetadata)
          : { details: toMetadata(metadata) },
      source,
      timestamp: new Date().toISOString(),
      ...(traceId ? { traceId } : {}),
    })
    .catch(() => {
      writeNativeRendererConsoleError(
        `[renderer] failed to write log event: ${event}`,
        message,
        metadata,
      );
    });
}

function getFailureDetails(error: unknown): unknown {
  if (isApiError(error)) {
    return {
      kind: error.kind,
      message: error.message,
      request: {
        ...(error.config?.method ? { method: error.config.method } : {}),
        ...(error.config?.url ? { url: error.config.url } : {}),
      },
      ...(error.data === undefined ? {} : { response: error.data }),
      ...(error.status === undefined ? {} : { status: error.status }),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }

  return { value: error };
}

function getTraceId(error: unknown) {
  return isApiError(error) ? error.config?.traceId : undefined;
}

/** Records a caught failure without requiring callers to know sink details. */
export function reportFailure({ context, error, event, message, source }: FailureTrackingInput) {
  writeFailureEvent(
    event,
    message,
    source,
    {
      ...(context === undefined ? {} : { context }),
      error: getFailureDetails(error),
    },
    getTraceId(error),
  );
}

/** Standard entry point for failures intentionally caught by a UI interaction. */
export function reportActionFailure(action: string, error: unknown, context?: unknown) {
  reportFailure({
    context: {
      action,
      ...(context === undefined ? {} : { details: context }),
    },
    error,
    event: "action.failed",
    message: `Action failed: ${action}`,
    source: "action",
  });
}
