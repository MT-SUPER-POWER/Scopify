"use client";

import { type RefObject, useEffect, useRef } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";

const PANEL_TRANSITION_MS = 220;

/**
 * 让可折叠的 ResizablePanel 随 `collapsed` 状态折叠/展开，同组面板一起平滑滑动。
 * 面板首次挂载时直接定位不做动画；`enabled` 为 false（面板未渲染）时重置，下次挂载重新按首次处理。
 */
export function useAnimatedPanelCollapse({
  panelRef,
  elementRef,
  collapsed,
  enabled = true,
}: {
  panelRef: RefObject<PanelImperativeHandle | null>;
  elementRef: RefObject<HTMLDivElement | null>;
  collapsed: boolean;
  enabled?: boolean;
}) {
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!enabled || !panel) {
      hasInitializedRef.current = false;
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (collapsed) panel.collapse();
      else panel.expand();
      return;
    }

    // 同组所有面板一起过渡：只给折叠的面板加过渡时，其余面板会瞬间跳到终值，
    // 过渡期间各面板 flex-grow 之和偏离，导致另一侧面板和主内容抖动。
    const panelElement = elementRef.current;
    const groupPanels = panelElement?.parentElement
      ? Array.from(panelElement.parentElement.children).filter(
          (child): child is HTMLElement =>
            child instanceof HTMLElement && child.hasAttribute("data-panel"),
        )
      : [];
    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clearTransition = () => {
      for (const element of groupPanels) {
        element.style.transition = "";
        element.style.willChange = "";
      }
    };
    let clearTransitionTimeout: number | undefined;
    if (!shouldReduceMotion) {
      for (const element of groupPanels) {
        element.style.transition = `flex-grow ${PANEL_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        element.style.willChange = "flex-grow";
      }
      clearTransitionTimeout = window.setTimeout(clearTransition, PANEL_TRANSITION_MS);
    }

    if (collapsed) panel.collapse();
    else panel.expand();

    return () => {
      if (clearTransitionTimeout !== undefined) {
        window.clearTimeout(clearTransitionTimeout);
      }
      clearTransition();
    };
  }, [collapsed, enabled, elementRef, panelRef]);
}
