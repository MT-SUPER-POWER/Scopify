"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppUpdateState } from "@/types/updater";

const initialState: AppUpdateState = {
  status: "idle",
  supported: false,
  currentVersion: "",
};

export function useAppUpdater() {
  const [state, setState] = useState<AppUpdateState>(initialState);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;
    let disposed = false;

    const api = window.electronAPI;
    api
      .getUpdateStatus()
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

    const unsubscribe = api.onUpdateStatusChanged((status) => {
      setState(status);
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const check = useCallback(async () => {
    const nextState = await window.electronAPI?.checkForUpdates();
    if (nextState) setState(nextState);
  }, []);

  const download = useCallback(async () => {
    const nextState = await window.electronAPI?.downloadUpdate();
    if (nextState) setState(nextState);
  }, []);

  const install = useCallback(() => {
    window.electronAPI?.quitAndInstallUpdate();
  }, []);

  return { state, check, download, install };
}
