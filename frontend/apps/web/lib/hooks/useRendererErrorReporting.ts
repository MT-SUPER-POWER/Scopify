"use client";

import { useEffect } from "react";

import { reportFailure } from "@/lib/web/errorTracking";
import { trackRendererEvent } from "@/lib/web/logger";

function getConsoleMessage(args: unknown[]) {
  const [first] = args;
  if (typeof first === "string") return first;
  if (first instanceof Error) return `${first.name}: ${first.message}`;
  return "Console reported a non-string value";
}

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

    const originalError = console.error;
    const originalWarn = console.warn;
    const trackConsole = (level: "error" | "warn", args: unknown[]) => {
      trackRendererEvent({
        event: `console.${level}`,
        level,
        message: getConsoleMessage(args),
        metadata: { args },
        source: "console",
      });
    };
    const trackedError = (...args: unknown[]) => {
      originalError(...args);
      trackConsole("error", args);
    };
    const trackedWarn = (...args: unknown[]) => {
      originalWarn(...args);
      trackConsole("warn", args);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    console.error = trackedError;
    console.warn = trackedWarn;
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      if (console.error === trackedError) console.error = originalError;
      if (console.warn === trackedWarn) console.warn = originalWarn;
    };
  }, []);
}
