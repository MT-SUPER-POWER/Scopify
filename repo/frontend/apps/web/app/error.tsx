"use client";

import { ErrorFallback } from "@/components/shared/ErrorFallback";
import type { ErrorFallbackProps } from "@/types/shared/errorComponents";

export default function Error({ error, reset }: ErrorFallbackProps) {
  return <ErrorFallback error={error} reset={reset} />;
}
