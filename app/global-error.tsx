"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";
import type { ErrorFallbackProps } from "@/types/components/error";

export default function GlobalError({ error, reset }: ErrorFallbackProps) {
  return (
    <html lang="en">
      <body>
        <ErrorFallback error={error} reset={reset} />
      </body>
    </html>
  );
}
