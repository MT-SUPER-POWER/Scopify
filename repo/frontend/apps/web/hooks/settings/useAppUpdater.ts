"use client";

import { useCallback, useEffect, useState } from "react";
import { runtime } from "@/lib/runtime";
import type { AppUpdateState } from "@/types/updater";

const initialState: AppUpdateState = {
  status: "idle",
  supported: false,
  currentVersion: "",
};

export function useAppUpdater() {
  const [state, setState] = useState<AppUpdateState>(initialState);

  useEffect(() => {
    let disposed = false;

    runtime.updates
      .getStatus()
      .then((status) => {
        if (!disposed) setState(status);
      })
      .catch((error: unknown) => {
        if (!disposed) {
          setState((current) => ({
            ...current,
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          }));
        }
      });

    const unsubscribe = runtime.updates.onStatusChanged((status) => {
      setState(status);
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const check = useCallback(async () => {
    try {
      setState(await runtime.updates.check());
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      }));
    }
  }, []);

  const download = useCallback(async () => {
    try {
      setState(await runtime.updates.download());
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      }));
    }
  }, []);

  const install = useCallback(() => {
    runtime.updates.install();
  }, []);

  return { state, check, download, install };
}
