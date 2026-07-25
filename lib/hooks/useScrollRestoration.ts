"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 存储 URL (pathname + searchParams) 对应容器的 scrollTop 记录
 */
const scrollPositions = new Map<string, number>();
const lastLoggedPositions = new Map<string, number>();
let activeScrollContainer: HTMLDivElement | null = null;
let activeScrollKey: string | null = null;
let ignoreTransitionScrollEvents = false;
let navigationTimeoutId: number | undefined;
let hasLoggedSuppressedTransitionScroll = false;

export function clearScrollPosition(url: string) {
  scrollPositions.delete(url);
  lastLoggedPositions.delete(url);
  console.log("[scroll-restoration] position cleared", { key: url });
}

function persistScrollPosition(
  container: HTMLDivElement,
  key: string,
  source: "scroll" | "route-change" | "before-navigation",
) {
  if (container.scrollHeight > container.clientHeight) {
    const position = container.scrollTop;
    scrollPositions.set(key, position);

    if (lastLoggedPositions.get(key) !== position || source !== "scroll") {
      lastLoggedPositions.set(key, position);
      console.log("[scroll-restoration] position saved", {
        key,
        position,
        source,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
      });
    }
  }
}

/**
 * Capture the active scroll container before Next.js begins a navigation.
 * Route transitions can emit scroll events before usePathname receives the new URL;
 * those events must not overwrite the page position we just captured.
 */
export function saveScrollPositionBeforeNavigation() {
  if (activeScrollContainer && activeScrollKey) {
    persistScrollPosition(activeScrollContainer, activeScrollKey, "before-navigation");
  } else {
    console.warn("[scroll-restoration] navigation snapshot skipped: no active container");
  }

  ignoreTransitionScrollEvents = true;
  hasLoggedSuppressedTransitionScroll = false;
  console.log("[scroll-restoration] navigation snapshot complete", {
    key: activeScrollKey,
    position: activeScrollContainer?.scrollTop,
  });

  if (typeof window !== "undefined") {
    if (navigationTimeoutId !== undefined) {
      window.clearTimeout(navigationTimeoutId);
    }

    // Recover if a navigation is cancelled before the URL changes.
    navigationTimeoutId = window.setTimeout(() => {
      ignoreTransitionScrollEvents = false;
      navigationTimeoutId = undefined;
      console.warn("[scroll-restoration] navigation snapshot timeout released");
    }, 5000);
  }
}

function resumeScrollPersistence() {
  ignoreTransitionScrollEvents = false;
  hasLoggedSuppressedTransitionScroll = false;

  if (navigationTimeoutId !== undefined && typeof window !== "undefined") {
    window.clearTimeout(navigationTimeoutId);
    navigationTimeoutId = undefined;
  }
}

/**
 * 辅助函数：设置 scrollTop 并同步广播原生 scroll 事件，
 * 确保 @tanstack/react-virtual 与 useSmoothPlaylistScroll 同步更新 internal targetScrollTop。
 */
function setContainerScrollTop(container: HTMLDivElement, position: number) {
  container.scrollTop = position;
  container.dispatchEvent(new Event("scroll"));
}

/**
 * 智能滚动恢复 Hook：
 * 自动保存每个路由页面的 ScrollContainer 滚动高度，在歌单/歌手/专辑/搜索等页面间切换时精准还原。
 */
export function useScrollRestoration(scrollContainer: HTMLDivElement | null) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const currentUrl = `${pathname}${searchString ? `?${searchString}` : ""}`;

  const currentUrlRef = useRef(currentUrl);
  const userScrolledRef = useRef(false);
  const isRestoringRef = useRef(false);

  // 1. 实时监听 scroll 事件。在用户主动滑动时更新记录
  useEffect(() => {
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (!currentUrlRef.current || isRestoringRef.current) return;

      if (ignoreTransitionScrollEvents) {
        if (!hasLoggedSuppressedTransitionScroll) {
          hasLoggedSuppressedTransitionScroll = true;
          console.log("[scroll-restoration] transition scroll ignored", {
            key: currentUrlRef.current,
            position: scrollContainer.scrollTop,
          });
        }
        return;
      }

      persistScrollPosition(scrollContainer, currentUrlRef.current, "scroll");
      userScrolledRef.current = true;
    };

    activeScrollContainer = scrollContainer;
    activeScrollKey = currentUrlRef.current;
    console.log("[scroll-restoration] active container bound", {
      key: activeScrollKey,
      position: scrollContainer.scrollTop,
    });
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);

      if (activeScrollContainer === scrollContainer) {
        activeScrollContainer = null;
        activeScrollKey = null;
      }
    };
  }, [scrollContainer, currentUrl]);

  // 2. 当 URL 发生切换时，恢复目标页面的滚动位置
  useEffect(() => {
    if (!scrollContainer) return;

    const previousUrl = currentUrlRef.current;
    const wasIgnoringTransitionScrollEvents = ignoreTransitionScrollEvents;
    if (previousUrl !== currentUrl && !ignoreTransitionScrollEvents) {
      persistScrollPosition(scrollContainer, previousUrl, "route-change");
    }

    currentUrlRef.current = currentUrl;
    activeScrollContainer = scrollContainer;
    activeScrollKey = currentUrl;
    const savedPos = scrollPositions.get(currentUrl);
    console.log("[scroll-restoration] route resolved", {
      from: previousUrl,
      to: currentUrl,
      transitionScrollWasIgnored: wasIgnoringTransitionScrollEvents,
      savedPosition: savedPos,
    });
    resumeScrollPersistence();
    userScrolledRef.current = false;

    if (savedPos !== undefined && savedPos > 0) {
      let animationFrameId: number;
      const startTime = Date.now();
      let hasLoggedInitialRestore = false;
      let hasLoggedResizeRestore = false;

      const applyScroll = () => {
        if (!scrollContainer || userScrolledRef.current) return;

        if (!hasLoggedInitialRestore) {
          hasLoggedInitialRestore = true;
          console.log("[scroll-restoration] restoring saved position", {
            key: currentUrl,
            position: savedPos,
          });
        }
        isRestoringRef.current = true;
        setContainerScrollTop(scrollContainer, savedPos);
        requestAnimationFrame(() => {
          isRestoringRef.current = false;
        });

        // 持续观察 1.5 秒（应对虚拟列表和 API 异步数据挂载）
        if (Date.now() - startTime < 1500) {
          animationFrameId = requestAnimationFrame(applyScroll);
        }
      };

      applyScroll();

      // 监听容器子 DOM 尺寸变动（歌单列表异步渲染出来后再次校准）
      const observer = new ResizeObserver(() => {
        if (!userScrolledRef.current && scrollContainer) {
          if (!hasLoggedResizeRestore) {
            hasLoggedResizeRestore = true;
            console.log("[scroll-restoration] restoring after content resize", {
              key: currentUrl,
              position: savedPos,
            });
          }
          isRestoringRef.current = true;
          setContainerScrollTop(scrollContainer, savedPos);
          requestAnimationFrame(() => {
            isRestoringRef.current = false;
          });
        }
      });

      if (scrollContainer.firstElementChild) {
        observer.observe(scrollContainer.firstElementChild);
      }

      return () => {
        cancelAnimationFrame(animationFrameId);
        observer.disconnect();
      };
    } else {
      // 没历史记录，还原置顶
      console.log("[scroll-restoration] no saved position, scrolling to top", {
        key: currentUrl,
      });
      isRestoringRef.current = true;
      setContainerScrollTop(scrollContainer, 0);
      requestAnimationFrame(() => {
        isRestoringRef.current = false;
      });
    }
  }, [currentUrl, scrollContainer]);
}
