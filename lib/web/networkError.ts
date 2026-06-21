import { isAxiosError } from "axios";
import type { ClassifiedNetworkError } from "@/types/network";

interface ErrorLike {
  code?: string;
  message?: string;
}

function hasNavigatorOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function classifyNetworkError(error: unknown): ClassifiedNetworkError {
  if (hasNavigatorOffline()) {
    return { kind: "offline", message: "offline", retryable: true };
  }

  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return { kind: "timeout", message: error.message, retryable: true };
    }
    if (error.code === "ERR_NETWORK" || !error.response) {
      return { kind: "network", message: error.message, retryable: true };
    }
    if (error.response.status >= 500) {
      return { kind: "backend", message: error.message, retryable: true };
    }
    return { kind: "business", message: error.message, retryable: false };
  }

  const maybeError = error as ErrorLike;
  if (maybeError.code === "ECONNABORTED") {
    return { kind: "timeout", message: maybeError.message ?? "timeout", retryable: true };
  }

  return {
    kind: "network",
    message: maybeError.message ?? "network unavailable",
    retryable: true,
  };
}
