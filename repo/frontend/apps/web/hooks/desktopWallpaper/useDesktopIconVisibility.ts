"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { DesktopIconVisibilityState } from "@scopifymusicplayer/desktop-contract";

import { runtime } from "@/lib/runtime";
import type { DesktopIconVisibilityControllerState } from "@/types/desktopIcons";

function unavailableState(error: unknown): DesktopIconVisibilityState {
  return {
    diagnostic: error instanceof Error ? error.message : String(error),
    supported: false,
    visible: null,
  };
}

export function useDesktopIconVisibility(): DesktopIconVisibilityControllerState {
  const [state, setState] = useState<DesktopIconVisibilityState | null>(null);
  const [isPending, setIsPending] = useState(false);
  const operationId = useRef(0);

  const refresh = useCallback(async () => {
    const currentOperation = ++operationId.current;
    setIsPending(true);
    try {
      const nextState = await runtime.desktopIcons.getVisibility();
      if (operationId.current === currentOperation) setState(nextState);
      return nextState;
    } catch (error) {
      const nextState = unavailableState(error);
      if (operationId.current === currentOperation) setState(nextState);
      return nextState;
    } finally {
      if (operationId.current === currentOperation) setIsPending(false);
    }
  }, []);

  const setVisible = useCallback(async (visible: boolean) => {
    const currentOperation = ++operationId.current;
    setIsPending(true);
    try {
      const nextState = await runtime.desktopIcons.setVisibility(visible);
      if (operationId.current === currentOperation) setState(nextState);
      return nextState;
    } finally {
      if (operationId.current === currentOperation) setIsPending(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onFocus = () => void refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  return { isPending, refresh, setVisible, state };
}
