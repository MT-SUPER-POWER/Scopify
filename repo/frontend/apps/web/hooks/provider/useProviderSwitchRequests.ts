"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import {
  createProviderSwitchSteps,
  PROVIDER_SWITCH_REQUESTED_EVENT,
  switchProvider,
  takePendingProviderSwitch,
} from "@/lib/providers/switchProvider";

/**
 * Runs the platform switch a finished login asked for. It returns the handler for the query
 * cache's restore, because the request must wait until the persisted cache is back, or the
 * restore would refill what the switch cleared; later requests in the same window arrive as an
 * event.
 */
export function useProviderSwitchRequests(queryClient: QueryClient) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const restoredRef = useRef(false);

  const runPending = useCallback(() => {
    const target = takePendingProviderSwitch();
    if (!target) return;
    void switchProvider(
      target,
      createProviderSwitchSteps(queryClient, () => routerRef.current.replace("/")),
    );
  }, [queryClient]);

  useEffect(() => {
    const onRequest = () => {
      if (restoredRef.current) runPending();
    };
    window.addEventListener(PROVIDER_SWITCH_REQUESTED_EVENT, onRequest);
    return () => window.removeEventListener(PROVIDER_SWITCH_REQUESTED_EVENT, onRequest);
  }, [runPending]);

  return useCallback(() => {
    restoredRef.current = true;
    runPending();
  }, [runPending]);
}
