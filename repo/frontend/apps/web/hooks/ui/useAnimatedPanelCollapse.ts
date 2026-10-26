"use client";

import { type RefObject, useEffect, useRef } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";

const PANEL_TRANSITION_MS = 220;

/**
 * 面板刚挂载时，面板组可能还没登记它的尺寸约束，此时 collapse/expand 会抛错并让整个布局进入错误边界；
 * 失败时下一帧再试一次，仍失败就放弃（面板保持默认尺寸，下次状态变化会再同步）。
 */
function syncCollapsed(
  panel: PanelImperativeHandle,
  collapsed: boolean,
  retry = true,
): number | undefined {
  try {
    if (collapsed) panel.collapse();
    else panel.expand();
  } catch {
    if (retry) return requestAnimationFrame(() => void syncCollapsed(panel, collapsed, false));
  }
  return undefined;
}

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
      // 推迟到下一帧，等面板组登记完新挂载面板的约束
      let retryFrame: number | undefined;
      let hasSynced = false;
      const frame = requestAnimationFrame(() => {
        hasSynced = true;
        retryFrame = syncCollapsed(panel, collapsed);
      });
      return () => {
        cancelAnimationFrame(frame);
        if (retryFrame !== undefined) cancelAnimationFrame(retryFrame);
        // 还没来得及同步就被清理（如 StrictMode 重复挂载），下次仍按首次挂载处理，不做动画
        if (!hasSynced) hasInitializedRef.current = false;
      };
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

    const retryFrame = syncCollapsed(panel, collapsed);

    return () => {
      if (retryFrame !== undefined) cancelAnimationFrame(retryFrame);
      if (clearTransitionTimeout !== undefined) {
        window.clearTimeout(clearTransitionTimeout);
      }
      clearTransition();
    };
  }, [collapsed, enabled, elementRef, panelRef]);
}
