"use client";

import { useEffect, useState } from "react";
import type { DesktopBackendStatus } from "@scopify/desktop-contract";
import { runtime } from "@/lib/runtime";
import type { RuntimeBackend } from "@/lib/runtime/types";

/** Live status of a Desktop-hosted backend; `null` outside Desktop or before the first reply. */
export function useDesktopBackendStatus(backend: RuntimeBackend): DesktopBackendStatus | null {
  const [status, setStatus] = useState<DesktopBackendStatus | null>(null);

  useEffect(() => {
    if (!runtime.isDesktop) return;

    let isMounted = true;
    void backend
      .getStatus()
      .then((nextStatus) => {
        if (isMounted) setStatus(nextStatus);
      })
      .catch(() => {});

    const unsubscribe = backend.onStatusChanged((nextStatus) => {
      if (isMounted) setStatus(nextStatus);
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [backend]);

  return status;
}
