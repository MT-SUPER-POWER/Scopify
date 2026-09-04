"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  McpClientConfiguration,
  McpConnectionTestResult,
  McpStatus,
} from "@scopify/desktop-contract";
import { runtime } from "@/lib/runtime";

/**
 * Owns only ephemeral MCP administration state for the settings screen.
 *
 * The persisted listener policy remains in `DesktopHostConfig.mcp` and is
 * saved by `useSettingsState`. A credential is retained only in this React
 * state after an explicit view or rotation action; it is never read from config.
 */
export function useMcpSettings(statusRefreshKey = 0) {
  const [status, setStatus] = useState<McpStatus | null>(null);
  const [clientConfiguration, setClientConfiguration] = useState<McpClientConfiguration | null>(
    null,
  );
  const [isRestarting, setIsRestarting] = useState(false);
  const [isRevealingCredential, setIsRevealingCredential] = useState(false);
  const [isRotatingCredential, setIsRotatingCredential] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<McpConnectionTestResult | null>(
    null,
  );

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

  useEffect(() => {
    setConnectionTestResult(null);
  }, [statusRefreshKey]);

  const restart = useCallback(async () => {
    if (!runtime.isDesktop || isRestarting) return null;

    setIsRestarting(true);
    try {
      const nextStatus = await runtime.mcp.restart();
      setStatus(nextStatus);
      setConnectionTestResult(null);
      return nextStatus;
    } finally {
      setIsRestarting(false);
    }
  }, [isRestarting]);

  const revealCredential = useCallback(async () => {
    if (!runtime.isDesktop || isRevealingCredential) return null;

    setIsRevealingCredential(true);
    try {
      const nextConfiguration = await runtime.mcp.getClientConfiguration();
      setClientConfiguration(nextConfiguration);
      return nextConfiguration;
    } finally {
      setIsRevealingCredential(false);
    }
  }, [isRevealingCredential]);

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

  const testConnection = useCallback(async () => {
    if (!runtime.isDesktop || isTestingConnection) return null;

    setIsTestingConnection(true);
    try {
      const result = await runtime.mcp.testConnection();
      setConnectionTestResult(result);
      return result;
    } finally {
      setIsTestingConnection(false);
    }
  }, [isTestingConnection]);

  return {
    clientConfiguration,
    connectionTestResult,
    isRevealingCredential,
    isRestarting,
    isRotatingCredential,
    isTestingConnection,
    refreshStatus,
    revealCredential,
    restart,
    rotateCredential,
    status,
    testConnection,
  };
}
