import type { ComponentType } from "react";

/**
 * A small identifier stored on a browser session-history entry. The snapshot
 * itself stays out of history.state so Next.js can retain ownership of its
 * private history fields.
 */
export type NavigationScrollEntryId = string;
export type NavigationScrollHistoryState = Record<string, unknown>;

export interface PixelNavigationScrollSnapshot {
  kind: "pixel";
  top: number;
}

/**
 * Measurements are intentionally opaque to the coordinator. A virtualizer
 * adapter owns their format and may pass TanStack Virtual snapshots here.
 */
export interface VirtualCollectionNavigationScrollSnapshot {
  anchorKey: string;
  anchorOffset: number;
  fallbackTop: number;
  kind: "virtual-collection";
  measurements?: unknown;
}

export type NavigationScrollSnapshot =
  PixelNavigationScrollSnapshot | VirtualCollectionNavigationScrollSnapshot;

export interface NavigationScrollSnapshotRecord {
  snapshot: NavigationScrollSnapshot;
  updatedAt: number;
}

export type NavigationScrollIntent = "initial" | "new" | "restore";
export type RouteRestorationPlaceholder = ComponentType;

export interface NavigationScrollCoordinatorState {
  entryId: NavigationScrollEntryId | null;
  isAtTop: boolean;
  isRestoring: boolean;
}

export interface NavigationScrollContextValue {
  isAtTop: boolean;
  isRestoring: boolean;
  registerRestorationAdapter: (adapter: NavigationScrollRestorationAdapter) => () => void;
  registerRestorationPlaceholder: (placeholder: RouteRestorationPlaceholder) => () => void;
  registerSurface: (element: HTMLDivElement | null) => void;
  restorationPlaceholder: null | RouteRestorationPlaceholder;
  scrollElement: HTMLDivElement | null;
}

export interface NavigationScrollSnapshotRegistryOptions {
  maxEntries?: number;
  storageKey?: string;
}

export interface NavigationScrollRestorationContext {
  signal: AbortSignal;
  snapshot: VirtualCollectionNavigationScrollSnapshot;
  surface: HTMLDivElement;
}

export type NavigationScrollRestoreReadiness = "ready" | "unavailable" | "waiting";

/**
 * Route-level contract for future virtual collections. The provider starts
 * with pixel restoration; a virtual page can register one adapter once its
 * data and virtualizer are ready.
 */
export interface NavigationScrollRestorationAdapter {
  capture: (surface: HTMLDivElement) => VirtualCollectionNavigationScrollSnapshot | null;
  getRestoreReadiness: (
    context: NavigationScrollRestorationContext,
  ) => NavigationScrollRestoreReadiness;
  restore: (context: NavigationScrollRestorationContext) => void | Promise<void>;
}

export interface NavigationScrollCoordinatorOptions {
  onStateChange?: (state: NavigationScrollCoordinatorState) => void;
  registry?: NavigationScrollSnapshotRegistryLike;
  restoreTimeoutMs?: number;
  window?: Window;
}

export interface NavigationScrollSnapshotRegistryLike {
  delete: (entryId: NavigationScrollEntryId) => void;
  get: (entryId: NavigationScrollEntryId) => NavigationScrollSnapshot | null;
  set: (entryId: NavigationScrollEntryId, snapshot: NavigationScrollSnapshot) => void;
}
