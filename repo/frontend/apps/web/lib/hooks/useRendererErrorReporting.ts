"use client";

import { useEffect } from "react";

import { reportFailure } from "@/lib/web/errorTracking";

export function useRendererErrorReporting() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error instanceof Error ? event.error : new Error(event.message);
      reportFailure({
        context: {
          column: event.colno,
          filename: event.filename,
          line: event.lineno,
        },
        error,
        event: "runtime.uncaught_error",
        message: "Uncaught renderer error",
        source: "runtime",
      });
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error ? event.reason : new Error("Unhandled non-Error rejection");
      reportFailure({
        error: reason,
        event: "runtime.unhandled_rejection",
        message: "Unhandled renderer rejection",
        source: "runtime",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
}
