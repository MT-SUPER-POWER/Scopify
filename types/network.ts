import type { AxiosRequestConfig } from "axios";

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
  noRetry?: boolean;
  retryCount?: number;
  suppressErrorToast?: boolean;
}
