"use client";

import { useCallback, useEffect, useState } from "react";
import type { McpClientConfiguration, McpStatus } from "@scopify/desktop-contract";
import { runtime } from "@/lib/runtime";

/**
 * Owns only ephemeral MCP administration state for the settings screen.
 *
 * The persisted listener policy remains in `DesktopHostConfig.mcp` and is
 * saved by `useSettingsState`. A credential is retained only in this React
 * state after the user explicitly rotates it; it is never read from config.
 */
export function useMcpSettings(statusRefreshKey = 0) {
  const [status, setStatus] = useState<McpStatus | null>(null);
  const [clientConfiguration, setClientConfiguration] = useState<McpClientConfiguration | null>(
    null,
  );
  const [isRestarting, setIsRestarting] = useState(false);
  const [isRotatingCredential, setIsRotatingCredential] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!runtime.isDesktop) {
      setStatus(null);
      return null;
    }

    const nextStatus = await runtime.mcp.getStatus();
    setStatus(nextStatus);
    return nextStatus;
  }, []);

  useEffect(() => {
    let active = true;

    void refreshStatus().catch(() => {
      if (active) setStatus(null);
    });

    return () => {
      active = false;
    };
  }, [refreshStatus, statusRefreshKey]);

  const restart = useCallback(async () => {
    if (!runtime.isDesktop || isRestarting) return null;

    setIsRestarting(true);
    try {
      const nextStatus = await runtime.mcp.restart();
      setStatus(nextStatus);
      return nextStatus;
    } finally {
      setIsRestarting(false);
    }
  }, [isRestarting]);

  const rotateCredential = useCallback(async () => {
    if (!runtime.isDesktop || isRotatingCredential) return null;

    setIsRotatingCredential(true);
    try {
      const nextConfiguration = await runtime.mcp.rotateCredential();
      setClientConfiguration(nextConfiguration);
      await refreshStatus();
      return nextConfiguration;
    } finally {
      setIsRotatingCredential(false);
    }
  }, [isRotatingCredential, refreshStatus]);

  return {
    clientConfiguration,
    isRestarting,
    isRotatingCredential,
    refreshStatus,
    restart,
    rotateCredential,
    status,
  };
}
