import { isAxiosError } from "axios";

import type { ApiErrorKind, ApiErrorOptions, ScopifyRequestConfig } from "@/types/network";

export class ApiError extends Error {
  readonly config?: ScopifyRequestConfig;
  readonly data?: unknown;
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor({ config, data, kind, message, status }: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.config = config;
    this.data = data;
    this.kind = kind;
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as unknown;
    const message = getErrorMessage(data) ?? error.message;
    const config = error.config as ScopifyRequestConfig | undefined;

    if (status === 301) {
      return new ApiError({ config, data, kind: "unauthenticated", message, status });
    }
    if (error.code === "ECONNABORTED") {
      return new ApiError({ config, data, kind: "timeout", message, status });
    }
    if (error.code === "ERR_NETWORK" || !error.response) {
      return new ApiError({ config, data, kind: "network", message, status });
    }
    if (status !== undefined && status >= 500) {
      return new ApiError({ config, data, kind: "backend", message, status });
    }

    return new ApiError({ config, data, kind: "business", message, status });
  }

  const maybeError = error as { code?: string; message?: string };
  return new ApiError({
    kind: maybeError.code === "ECONNABORTED" ? "timeout" : "network",
    message: maybeError.message ?? "Network unavailable",
  });
}

function getErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;

  const payload = data as { message?: unknown; msg?: unknown };
  if (typeof payload.msg === "string") return payload.msg;
  return typeof payload.message === "string" ? payload.message : undefined;
}
