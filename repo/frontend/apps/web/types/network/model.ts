import type { AxiosRequestConfig } from "axios";
import type { LogMetadata } from "@/types/core/logging";

export type ApiErrorKind = "unauthenticated" | NetworkErrorKind;
export interface ApiErrorOptions {
  config?: ApiRequestConfig;
  data?: unknown;
  kind: ApiErrorKind;
  message: string;
  status?: number;
}

export type NetworkErrorKind = "backend" | "business" | "network" | "offline" | "timeout";

export type BackendPingFailureReason = "invalid-response" | "network" | "server" | "timeout";

export interface BackendPingSuccess {
  latencyMs: number;
  reachable: true;
  url: string;
  version: string | null;
}

export interface BackendPingFailure {
  latencyMs: number;
  reachable: false;
  reason: BackendPingFailureReason;
  status?: number;
  url: string;
}

export type BackendPingResult = BackendPingFailure | BackendPingSuccess;

/** Request options every platform client understands. */
export interface ApiRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /** Operation context appended to the final transport failure event. */
  errorContext?: LogMetadata;
  /** Expected top-level business codes for endpoints that reply with HTTP 200 on failure. */
  expectedBusinessCodes?: readonly number[];
  /** Correlates retries, transport failures, Query failures and action failures. */
  traceId?: string;
  /** Replaces the user network timeout for long transfers such as file uploads. */
  transferTimeout?: number;
}
