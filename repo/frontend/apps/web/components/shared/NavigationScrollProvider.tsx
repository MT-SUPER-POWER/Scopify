"use client";

import { NavigationScrollCoordinator } from "@/lib/navigation-scroll/coordinator";
import type {
  NavigationScrollContextValue,
  NavigationScrollCoordinatorState,
  NavigationScrollRestorationAdapter,
  RouteRestorationPlaceholder,
} from "@/types/navigation-scroll";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const NavigationScrollContext = createContext<NavigationScrollContextValue | null>(null);
// isAtTop 会在滚动越过顶部时翻转，单独拆出，避免所有只需要 scrollElement 的消费者（整页内容）随之重渲染
const NavigationScrollTopContext = createContext(true);

export function NavigationScrollProvider({ children }: PropsWithChildren) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState<NavigationScrollCoordinatorState>({
    entryId: null,
    isAtTop: true,
    isRestoring: false,
  });
  const coordinatorRef = useRef<NavigationScrollCoordinator | null>(null);
  const restorationPlaceholderRef = useRef<RouteRestorationPlaceholder | null>(null);
  const [restorationPlaceholder, setRestorationPlaceholder] =
    useState<RouteRestorationPlaceholder | null>(null);

  if (!coordinatorRef.current) {
    coordinatorRef.current = new NavigationScrollCoordinator({ onStateChange: setScrollState });
  }

  const registerSurface = useCallback((element: HTMLDivElement | null) => {
    coordinatorRef.current?.registerSurface(element);
    setScrollElement(element);
  }, []);

  const registerRestorationAdapter = useCallback(
    (adapter: NavigationScrollRestorationAdapter) =>
      coordinatorRef.current?.registerRestorationAdapter(adapter) ?? (() => undefined),
    [],
  );

  const registerRestorationPlaceholder = useCallback((placeholder: RouteRestorationPlaceholder) => {
    restorationPlaceholderRef.current = placeholder;
    setRestorationPlaceholder(() => placeholder);

    return () => {
      if (restorationPlaceholderRef.current !== placeholder) return;
      restorationPlaceholderRef.current = null;
      setRestorationPlaceholder(null);
    };
  }, []);

  useEffect(() => {
    const coordinator = coordinatorRef.current;
    coordinator?.start();

    return () => coordinator?.destroy();
  }, []);

  const value = useMemo<NavigationScrollContextValue>(
    () => ({
      isRestoring: scrollState.isRestoring,
      registerRestorationAdapter,
      registerRestorationPlaceholder,
      registerSurface,
      restorationPlaceholder,
      scrollElement,
    }),
    [
      registerRestorationAdapter,
      registerRestorationPlaceholder,
      registerSurface,
      restorationPlaceholder,
      scrollElement,
      scrollState.isRestoring,
    ],
  );

  return (
    <NavigationScrollContext.Provider value={value}>
      <NavigationScrollTopContext.Provider value={scrollState.isAtTop}>
        {children}
      </NavigationScrollTopContext.Provider>
    </NavigationScrollContext.Provider>
  );
}

export function useNavigationScroll() {
  const context = useContext(NavigationScrollContext);
  if (!context) {
    throw new Error("useNavigationScroll must be used within NavigationScrollProvider");
  }

  return context;
}

/** 主滚动面是否位于顶部；只有依赖它的组件会在翻转时重渲染。 */
export function useIsScrollAtTop() {
  return useContext(NavigationScrollTopContext);
}

export function usePrimaryScrollSurface() {
  return useNavigationScroll().scrollElement;
}

export function useNavigationScrollRestorationAdapter(
  adapter: NavigationScrollRestorationAdapter | null,
) {
  const { registerRestorationAdapter } = useNavigationScroll();

  useEffect(() => {
    if (!adapter) return;
    return registerRestorationAdapter(adapter);
  }, [adapter, registerRestorationAdapter]);
}

export function useRouteRestorationPlaceholder(placeholder: RouteRestorationPlaceholder) {
  const { registerRestorationPlaceholder } = useNavigationScroll();

  useLayoutEffect(
    () => registerRestorationPlaceholder(placeholder),
    [placeholder, registerRestorationPlaceholder],
  );
}
