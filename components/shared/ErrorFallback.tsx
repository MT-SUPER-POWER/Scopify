"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { reportFailure } from "@/lib/web/errorTracking";
import type { ErrorFallbackProps } from "@/types/components/error";

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  useEffect(() => {
    reportFailure({
      context: error.digest ? { digest: error.digest } : undefined,
      error,
      event: "next.error_boundary",
      message: "Next.js error boundary rendered",
      source: "runtime",
    });
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6 text-foreground">
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
