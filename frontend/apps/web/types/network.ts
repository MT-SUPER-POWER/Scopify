import type { AxiosRequestConfig } from "axios";
import type { LogMetadata } from "@/types/logging";

export type ApiErrorKind = "unauthenticated" | NetworkErrorKind;
export interface ApiErrorOptions {
  config?: ScopifyRequestConfig;
  data?: unknown;
  kind: ApiErrorKind;
  message: string;
  status?: number;
}

export interface ClassifiedNetworkError {
  kind: NetworkErrorKind;
  message: string;
  retryable: boolean;
}

export type NetworkErrorKind = "backend" | "business" | "network" | "offline" | "timeout";

export interface ScopifyRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /** Operation context appended to the final transport failure event. */
  errorContext?: LogMetadata;
  /** Expected top-level business codes for endpoints that reply with HTTP 200 on failure. */
  expectedBusinessCodes?: readonly number[];
  /** Correlates retries, transport failures, Query failures and action failures. */
  traceId?: string;
}
