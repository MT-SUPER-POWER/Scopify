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

export type RendererLogSource = (typeof RENDERER_LOG_SOURCES)[number];

export type LogValue = LogMetadata | LogValue[] | boolean | null | number | string;

export interface LogMetadata {
  [key: string]: LogValue;
}

export interface RendererLogEvent {
  event?: string;
  id?: string;
  level: RendererLogLevel;
  message: string;
  metadata?: LogMetadata;
  source?: RendererLogSource;
  timestamp?: string;
  traceId?: string;
}

export interface RendererTrackingEvent {
  event: string;
  level: RendererLogLevel;
  message: string;
  metadata?: unknown;
  source: RendererLogSource;
  traceId?: string;
}
