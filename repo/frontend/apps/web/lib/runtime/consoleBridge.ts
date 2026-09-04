import type {
  LogMetadata,
  LogValue,
  RendererLogEvent,
  RendererLogLevel,
} from "@scopify/desktop-contract";

import type { RuntimeLogging } from "./types";

const MAX_ARRAY_LENGTH = 20;
const MAX_DEPTH = 4;
const MAX_STRING_LENGTH = 2_000;
const SENSITIVE_KEY = /authorization|cookie|csrf|music_[a-z_]+|password|secret|token/i;
const SENSITIVE_VALUE =
  /(MUSIC_[A-Z_]+|__csrf|authorization|cookie|password|secret|token)=([^\s;&]+)/gi;
const CONSOLE_BRIDGE_STATE = Symbol.for("scopify.renderer-console-bridge");

type ConsoleMethod = "debug" | "error" | "info" | "log" | "warn";
type ConsoleMethodFunction = (...args: unknown[]) => void;

interface ConsoleBridgeState {
  forwarding: boolean;
  logging: RuntimeLogging;
}

type GlobalWithConsoleBridge = typeof globalThis & {
  [CONSOLE_BRIDGE_STATE]?: ConsoleBridgeState;
};

const nativeConsole: Record<ConsoleMethod, ConsoleMethodFunction> = {
  debug: console.debug.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  log: console.log.bind(console),
  warn: console.warn.bind(console),
};

/**
 * Keeps the browser console visible while forwarding renderer console calls to Main on Desktop.
 * The global marker makes this safe across Next HMR re-evaluation.
 */
export function installRendererConsoleBridge(logging: RuntimeLogging): void {
  if (typeof window === "undefined") return;

  const globalObject = globalThis as GlobalWithConsoleBridge;
  const existingState = globalObject[CONSOLE_BRIDGE_STATE];
  if (existingState) {
    existingState.logging = logging;
    return;
  }

  const state: ConsoleBridgeState = { forwarding: false, logging };
  globalObject[CONSOLE_BRIDGE_STATE] = state;
  const targetConsole = console as unknown as Record<ConsoleMethod, ConsoleMethodFunction>;

  for (const method of Object.keys(nativeConsole) as ConsoleMethod[]) {
    targetConsole[method] = (...args) => {
      nativeConsole[method](...args);
      forwardConsoleCall(state, method, args);
    };
  }
}

/** Used by the failure path of the logger itself to avoid recursively forwarding a failed write. */
export function writeNativeRendererConsoleError(...args: unknown[]): void {
  nativeConsole.error(...args);
}

function forwardConsoleCall(
  state: ConsoleBridgeState,
  method: ConsoleMethod,
  args: unknown[],
): void {
  if (state.forwarding) return;

  const [first, ...rest] = args;
  const event: RendererLogEvent = {
    event: `console.${method}`,
    id: createEventId(),
    level: levelForConsoleMethod(method),
    message: formatConsoleMessage(first),
    source: "console",
    timestamp: new Date().toISOString(),
    ...(rest.length > 0 ? { metadata: { arguments: rest.map((value) => toLogValue(value)) } } : {}),
  };

  state.forwarding = true;
  try {
    void state.logging.write(event).catch(() => undefined);
  } catch {
    // The original console call has already been emitted; logging must never break the Renderer.
  } finally {
    state.forwarding = false;
  }
}

function levelForConsoleMethod(method: ConsoleMethod): RendererLogLevel {
  if (method === "debug") return "debug";
  if (method === "warn") return "warn";
  if (method === "error") return "error";
  return "info";
}

function formatConsoleMessage(value: unknown): string {
  if (typeof value === "string") return redactString(value);
  const normalized = toLogValue(value);
  if (typeof normalized === "string") return normalized;

  try {
    return truncate(JSON.stringify(normalized) ?? String(value));
  } catch {
    return truncate(String(value));
  }
}

function createEventId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `renderer-console-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function redactString(value: string): string {
  return truncate(value.replace(SENSITIVE_VALUE, "$1=[REDACTED]"));
}

function truncate(value: string): string {
  return value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`
    : value;
}

function toLogValue(value: unknown, depth = 0, seen = new WeakSet<object>()): LogValue {
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
    return value.slice(0, MAX_ARRAY_LENGTH).map((entry) => toLogValue(entry, depth + 1, seen));
  }

  const metadata: LogMetadata = {};
  for (const [key, entry] of Object.entries(value)) {
    metadata[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : toLogValue(entry, depth + 1, seen);
  }
  return metadata;
}
