import { isApiError } from "@/lib/web/apiError";
import { trackRendererEvent } from "@/lib/web/logger";
import type { RendererLogSource } from "@/types/logging";

interface FailureTrackingInput {
  context?: unknown;
  error: unknown;
  event: string;
  message: string;
  source: RendererLogSource;
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

/** Records a caught failure without requiring callers to know sink or redaction details. */
export function reportFailure({ context, error, event, message, source }: FailureTrackingInput) {
  trackRendererEvent({
    event,
    level: "error",
    message,
    metadata: {
      ...(context === undefined ? {} : { context }),
      error: getFailureDetails(error),
    },
    source,
    traceId: getTraceId(error),
  });
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
