"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppUpdateState } from "@/types/updater";

const initialState: AppUpdateState = { status: "idle" };

export function useAppUpdater() {
  const [state, setState] = useState<AppUpdateState>(initialState);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;
    let disposed = false;

    window.electronAPI.getUpdateStatus().then((status) => {
      if (!disposed) setState(status);
    });

    window.electronAPI.onUpdateStatusChanged((status) => {
      setState(status);
    });

    return () => {
      disposed = true;
      window.electronAPI?.off("updater:status-changed");
    };
  }, []);

  const check = useCallback(async () => {
    setState((current) => ({ ...current, status: "checking" }));
    await window.electronAPI?.checkForUpdates();
  }, []);

  const download = useCallback(async () => {
    setState((current) => ({ ...current, status: "downloading" }));
    await window.electronAPI?.downloadUpdate();
  }, []);

  const install = useCallback(() => {
    window.electronAPI?.quitAndInstallUpdate();
  }, []);

  return { state, check, download, install };
}
