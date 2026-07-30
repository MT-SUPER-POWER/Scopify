export const RENDERER_LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type RendererLogLevel = (typeof RENDERER_LOG_LEVELS)[number];

export const RENDERER_LOG_SOURCES = [
  "action",
  "app",
  "console",
  "query",
  "runtime",
  "transport",
] as const;

/** Identifies the subsystem that observed a renderer event. */
export type RendererLogSource = (typeof RENDERER_LOG_SOURCES)[number];

export type LogValue = LogMetadata | LogValue[] | boolean | null | number | string;

export interface LogMetadata {
  [key: string]: LogValue;
}

export interface RendererLogEvent {
  /** Stable schema name for external log sinks. */
  event?: string;
  /** Per-event identifier, useful when correlating a renderer event with a file entry. */
  id?: string;
  level: RendererLogLevel;
  message: string;
  metadata?: LogMetadata;
  /** Request/action correlation identifier; never contains a credential. */
  traceId?: string;
  /** ISO timestamp generated in the renderer before it crosses a process boundary. */
  timestamp?: string;
  source?: RendererLogSource;
}

export interface RendererTrackingEvent {
  event: string;
  level: RendererLogLevel;
  message: string;
  metadata?: unknown;
  source: RendererLogSource;
  traceId?: string;
}
