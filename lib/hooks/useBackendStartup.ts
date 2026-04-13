"use client";

import { useEffect, useState } from "react";
import type { BackendStartupStatus } from "@/types/backend";

const WEB_READY_STATUS: BackendStartupStatus = {
  state: "ready",
  ready: true,
  url: "",
};

const ELECTRON_STARTING_STATUS: BackendStartupStatus = {
  state: "starting",
  ready: false,
  url: "",
};

export function useBackendStartup() {
  const [status, setStatus] = useState<BackendStartupStatus>(() => {
    if (typeof window === "undefined") {
      return ELECTRON_STARTING_STATUS;
    }
    return window.electronAPI ? ELECTRON_STARTING_STATUS : WEB_READY_STATUS;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) {
      setStatus(WEB_READY_STATUS);
      return;
    }

    let cancelled = false;

    window.electronAPI.getBackendStatus()
      .then((nextStatus) => {
        if (!cancelled) {
          setStatus(nextStatus);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus(WEB_READY_STATUS);
        }
      });

    window.electronAPI.onBackendStatusChanged((nextStatus) => {
      if (!cancelled) {
        setStatus(nextStatus);
      }
    });

    return () => {
      cancelled = true;
      window.electronAPI?.off("backend-status-changed");
    };
  }, []);

  return status;
}
