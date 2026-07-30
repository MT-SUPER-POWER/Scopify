import {
  createNavigationScrollEntryId,
  getNavigationScrollEntryId,
  withNavigationScrollEntryId,
} from "@/lib/navigation-scroll/historyState";
import { NavigationScrollSnapshotRegistry } from "@/lib/navigation-scroll/snapshotRegistry";
import type {
  NavigationScrollCoordinatorOptions,
  NavigationScrollCoordinatorState,
  NavigationScrollEntryId,
  NavigationScrollIntent,
  NavigationScrollRestorationAdapter,
  NavigationScrollRestoreReadiness,
  NavigationScrollSnapshot,
} from "@/types/navigation-scroll";

const AT_TOP_TOLERANCE_PX = 1;
const DEFAULT_RESTORE_TIMEOUT_MS = 2_000;
const RESTORE_RETRY_DELAY_MS = 32;

/**
 * Coordinates the only route-level scroll surface. It owns history-entry IDs,
 * snapshot capture, and restoration writes; pages only register their surface
 * and (later) an optional virtual collection adapter.
 */
export class NavigationScrollCoordinator {
  private activeEntryId: NavigationScrollEntryId | null = null;
  private activeSurface: HTMLDivElement | null = null;
  private adapterRestoreInFlightToken: number | null = null;
  private history: History | null;
  private isHistoryMutationInProgress = false;
  private navigationEpoch = 0;
  private onStateChange: ((state: NavigationScrollCoordinatorState) => void) | undefined;
  private originalPushState: History["pushState"] | null = null;
  private originalReplaceState: History["replaceState"] | null = null;
  private pendingIntent: NavigationScrollIntent = "initial";
  private previousScrollRestoration: ScrollRestoration | null = null;
  private restoreAbortController: AbortController | null = null;
  private restoreObserver: ResizeObserver | null = null;
  private restoreRetryTimer: number | null = null;
  private restoreRaf: number | null = null;
  private restoreStartedAt = 0;
  private restorationAdapter: NavigationScrollRestorationAdapter | null = null;
  private restoreToken = 0;
  private scrollCaptureRaf: number | null = null;
  private stateNotificationRaf: number | null = null;
  private started = false;
  private state: NavigationScrollCoordinatorState = {
    entryId: null,
    isAtTop: true,
    isRestoring: false,
  };
  private surfaceEpoch = -1;
  private window: Window | null;

  private readonly registry;
  private readonly restoreTimeoutMs: number;

  constructor(options: NavigationScrollCoordinatorOptions = {}) {
    this.history =
      options.window?.history ?? (typeof window === "undefined" ? null : window.history);
    this.window = options.window ?? (typeof window === "undefined" ? null : window);
    this.onStateChange = options.onStateChange;
    this.registry = options.registry ?? new NavigationScrollSnapshotRegistry();
    this.restoreTimeoutMs = options.restoreTimeoutMs ?? DEFAULT_RESTORE_TIMEOUT_MS;
  }

  destroy() {
    if (!this.started) return;

    this.started = false;
    this.cancelRestore();
    this.detachSurface();

    if (this.window) {
      this.window.removeEventListener("popstate", this.handlePopState);
      if (this.stateNotificationRaf !== null) {
        this.window.cancelAnimationFrame(this.stateNotificationRaf);
      }
    }
    this.stateNotificationRaf = null;

    if (this.history) {
      if (this.originalPushState) this.history.pushState = this.originalPushState;
      if (this.originalReplaceState) this.history.replaceState = this.originalReplaceState;
      if (this.previousScrollRestoration) {
        this.history.scrollRestoration = this.previousScrollRestoration;
      }
    }
  }

  /**
   * A route-level virtual list may opt in once it can produce an anchor
   * snapshot. The React provider intentionally does not expose this yet; it
   * keeps the pixel migration independent from playlist integration.
   */
  registerRestorationAdapter(adapter: NavigationScrollRestorationAdapter) {
    this.restorationAdapter = adapter;
    this.scheduleRestoreCheck();

    return () => {
      if (this.restorationAdapter !== adapter) return;
      this.restorationAdapter = null;
      this.scheduleRestoreCheck();
    };
  }

  registerSurface(surface: HTMLDivElement | null) {
    if (!this.started) this.start();
    if (surface === this.activeSurface) return;

    this.detachSurface();
    this.activeSurface = surface;

    if (!surface) return;

    surface.addEventListener("scroll", this.handleSurfaceScroll, { passive: true });
    this.updateAtTop(surface);

    if (this.surfaceEpoch === this.navigationEpoch) return;
    this.surfaceEpoch = this.navigationEpoch;
    this.handleRegisteredSurface(surface, this.navigationEpoch);
  }

  start() {
    if (this.started || !this.history || !this.window) return;

    this.started = true;
    this.previousScrollRestoration = this.history.scrollRestoration;
    this.history.scrollRestoration = "manual";
    this.installHistoryPatch();
    this.activeEntryId = this.ensureCurrentEntryId();
    this.pendingIntent = this.registry.get(this.activeEntryId) ? "initial" : "new";
    this.setState({ entryId: this.activeEntryId });
    this.window.addEventListener("popstate", this.handlePopState);
  }

  private activateNewEntry(entryId: NavigationScrollEntryId) {
    this.cancelRestore();
    this.activeEntryId = entryId;
    this.navigationEpoch += 1;
    this.pendingIntent = "new";
    this.surfaceEpoch = -1;
    this.registry.delete(entryId);
    // Next may call history.pushState from useInsertionEffect. Keep history
    // bookkeeping synchronous, but never schedule a React update from there.
    this.setState({ entryId, isAtTop: true, isRestoring: false }, { deferNotification: true });
  }

  private applyFallback(surface: HTMLDivElement, snapshot: NavigationScrollSnapshot | null) {
    const requestedTop =
      snapshot?.kind === "virtual-collection" ? snapshot.fallbackTop : (snapshot?.top ?? 0);
    this.applyScrollTop(surface, requestedTop);
  }

  private applyScrollTop(surface: HTMLDivElement, requestedTop: number) {
    const maximumTop = Math.max(0, surface.scrollHeight - surface.clientHeight);
    surface.scrollTop = Math.min(Math.max(0, requestedTop), maximumTop);
    this.updateAtTop(surface);
  }

  private beginRestore(surface: HTMLDivElement, epoch: number) {
    const entryId = this.activeEntryId;
    const snapshot = entryId ? this.registry.get(entryId) : null;

    if (!snapshot) {
      this.applyFallback(surface, null);
      this.completeRestore(epoch, surface);
      return;
    }

    this.cancelRestore();
    const token = this.restoreToken;
    this.restoreAbortController = new AbortController();
    this.restoreStartedAt = Date.now();
    this.setState({ isRestoring: true });
    this.observeSurfaceForRestore(surface);
    this.scheduleRestoreCheck(token);
  }

  private cancelRestore() {
    this.restoreToken += 1;
    this.adapterRestoreInFlightToken = null;
    this.restoreAbortController?.abort();
    this.restoreAbortController = null;
    this.restoreObserver?.disconnect();
    this.restoreObserver = null;

    if (this.window && this.restoreRaf !== null) {
      this.window.cancelAnimationFrame(this.restoreRaf);
    }
    this.restoreRaf = null;

    if (this.window && this.restoreRetryTimer !== null) {
      this.window.clearTimeout(this.restoreRetryTimer);
    }
    this.restoreRetryTimer = null;
  }

  private captureActiveSnapshot() {
    const surface = this.activeSurface;
    const entryId = this.activeEntryId;
    if (!surface || !entryId) return;

    const snapshot = this.captureSnapshot(surface);
    this.registry.set(entryId, snapshot);
    this.updateAtTop(surface);
  }

  private captureSnapshot(surface: HTMLDivElement): NavigationScrollSnapshot {
    try {
      const virtualSnapshot = this.restorationAdapter?.capture(surface);
      if (virtualSnapshot) return virtualSnapshot;
    } catch {
      // Pixel snapshots remain a safe fallback if a route adapter is torn down.
    }

    return { kind: "pixel", top: surface.scrollTop };
  }

  private completeRestore(epoch: number, surface: HTMLDivElement) {
    if (!this.isCurrentRestore(epoch, surface)) return;

    this.cancelRestore();
    this.updateAtTop(surface);
    this.setState({ isRestoring: false });
  }

  private detachSurface() {
    if (!this.activeSurface) return;

    this.activeSurface.removeEventListener("scroll", this.handleSurfaceScroll);
    this.activeSurface = null;
    // React development effects may immediately re-register the same template
    // surface. Treat that registration as a fresh restoration opportunity.
    this.surfaceEpoch = -1;
    this.cancelRestore();
  }

  private ensureCurrentEntryId() {
    const existingEntryId = this.history ? getNavigationScrollEntryId(this.history.state) : null;
    if (existingEntryId) return existingEntryId;

    const entryId = createNavigationScrollEntryId();
    this.replaceCurrentHistoryState(entryId);
    return entryId;
  }

  private handleHistoryPushState: History["pushState"] = (data, unused, url) => {
    if (!this.history || !this.originalPushState) return;
    if (this.isHistoryMutationInProgress) {
      this.originalPushState.call(
        this.history,
        withNavigationScrollEntryId(data, this.activeEntryId ?? createNavigationScrollEntryId()),
        unused,
        url,
      );
      return;
    }

    this.captureActiveSnapshot();
    const previousEntryId = this.activeEntryId;
    const entryId = createNavigationScrollEntryId();
    this.activeEntryId = entryId;
    this.isHistoryMutationInProgress = true;

    try {
      this.originalPushState.call(
        this.history,
        withNavigationScrollEntryId(data, entryId),
        unused,
        url,
      );
      this.activateNewEntry(entryId);
    } catch (error) {
      this.activeEntryId = previousEntryId;
      throw error;
    } finally {
      this.isHistoryMutationInProgress = false;
    }
  };

  private handleHistoryReplaceState: History["replaceState"] = (data, unused, url) => {
    if (!this.history || !this.originalReplaceState) return;
    const currentEntryId = this.activeEntryId ?? createNavigationScrollEntryId();

    if (this.isHistoryMutationInProgress) {
      this.originalReplaceState.call(
        this.history,
        withNavigationScrollEntryId(data, currentEntryId),
        unused,
        url,
      );
      return;
    }

    // App Router synchronizes route state with replaceState after popstate.
    // That state update still belongs to the traversed history entry.
    if (this.pendingIntent === "restore") {
      this.isHistoryMutationInProgress = true;

      try {
        this.originalReplaceState.call(
          this.history,
          withNavigationScrollEntryId(data, currentEntryId),
          unused,
          url,
        );
      } finally {
        this.isHistoryMutationInProgress = false;
      }

      return;
    }

    this.captureActiveSnapshot();
    const entryId = createNavigationScrollEntryId();
    const previousEntryId = this.activeEntryId;
    this.activeEntryId = entryId;
    this.isHistoryMutationInProgress = true;

    try {
      this.originalReplaceState.call(
        this.history,
        withNavigationScrollEntryId(data, entryId),
        unused,
        url,
      );
      this.registry.delete(currentEntryId);
      this.activateNewEntry(entryId);
    } catch (error) {
      this.activeEntryId = previousEntryId;
      throw error;
    } finally {
      this.isHistoryMutationInProgress = false;
    }
  };

  private readonly handlePopState = () => {
    this.captureActiveSnapshot();
    this.cancelRestore();
    this.activeEntryId = this.ensureCurrentEntryId();
    this.navigationEpoch += 1;
    this.pendingIntent = "restore";
    this.surfaceEpoch = -1;
    this.setState({ entryId: this.activeEntryId, isRestoring: true });

    // Search keyword/category history traversal only changes query parameters,
    // so App Router keeps the current template and scroll surface mounted.
    // Start restoration against that surface instead of waiting forever for a
    // registerSurface call that will never happen.
    const surface = this.activeSurface;
    if (!surface) return;

    this.surfaceEpoch = this.navigationEpoch;
    this.handleRegisteredSurface(surface, this.navigationEpoch);
  };

  private readonly handleSurfaceScroll = () => {
    const surface = this.activeSurface;
    if (!surface) return;

    this.updateAtTop(surface);
    if (this.state.isRestoring || !this.window || this.scrollCaptureRaf !== null) return;
    const entryId = this.activeEntryId;

    this.scrollCaptureRaf = this.window.requestAnimationFrame(() => {
      this.scrollCaptureRaf = null;
      if (
        this.state.isRestoring ||
        this.activeSurface !== surface ||
        this.activeEntryId !== entryId
      ) {
        return;
      }
      this.captureActiveSnapshot();
    });
  };

  private handleRegisteredSurface(surface: HTMLDivElement, epoch: number) {
    if (!this.isCurrentRestore(epoch, surface)) return;

    if (this.pendingIntent === "new") {
      this.applyFallback(surface, null);
      this.setState({ isRestoring: false });
      return;
    }

    this.beginRestore(surface, epoch);
  }

  private installHistoryPatch() {
    if (!this.history) return;

    this.originalPushState = this.history.pushState;
    this.originalReplaceState = this.history.replaceState;
    this.history.pushState = this.handleHistoryPushState;
    this.history.replaceState = this.handleHistoryReplaceState;
  }

  private isCurrentRestore(epoch: number, surface: HTMLDivElement) {
    return this.navigationEpoch === epoch && this.activeSurface === surface;
  }

  private observeSurfaceForRestore(surface: HTMLDivElement) {
    if (typeof ResizeObserver === "undefined") return;

    this.restoreObserver = new ResizeObserver(() => {
      // ResizeObserver only requests a frame; scrollTop writes stay in the coordinator's frame.
      this.scheduleRestoreCheck();
    });
    this.restoreObserver.observe(surface);
    if (surface.firstElementChild instanceof Element) {
      this.restoreObserver.observe(surface.firstElementChild);
    }
  }

  private replaceCurrentHistoryState(entryId: NavigationScrollEntryId) {
    if (!this.history || !this.originalReplaceState) return;

    this.isHistoryMutationInProgress = true;
    try {
      this.originalReplaceState.call(
        this.history,
        withNavigationScrollEntryId(this.history.state, entryId),
        "",
      );
    } finally {
      this.isHistoryMutationInProgress = false;
    }
  }

  private runRestoreCheck(token: number) {
    const surface = this.activeSurface;
    const entryId = this.activeEntryId;
    const epoch = this.navigationEpoch;
    const snapshot = entryId ? this.registry.get(entryId) : null;

    if (!surface || token !== this.restoreToken || !this.isCurrentRestore(epoch, surface)) return;

    if (!snapshot) {
      this.applyFallback(surface, null);
      this.completeRestore(epoch, surface);
      return;
    }

    if (snapshot.kind === "virtual-collection") {
      this.restoreVirtualSnapshot(surface, epoch, token, snapshot);
      return;
    }

    const maximumTop = Math.max(0, surface.scrollHeight - surface.clientHeight);
    if (maximumTop + AT_TOP_TOLERANCE_PX >= snapshot.top) {
      this.applyScrollTop(surface, snapshot.top);
      this.completeRestore(epoch, surface);
      return;
    }

    if (Date.now() - this.restoreStartedAt >= this.restoreTimeoutMs) {
      this.applyFallback(surface, snapshot);
      this.completeRestore(epoch, surface);
      return;
    }

    this.scheduleRestoreRetry(token);
  }

  private restoreVirtualSnapshot(
    surface: HTMLDivElement,
    epoch: number,
    token: number,
    snapshot: Extract<NavigationScrollSnapshot, { kind: "virtual-collection" }>,
  ) {
    const adapter = this.restorationAdapter;
    const abortController = this.restoreAbortController;

    if (!adapter || !abortController) {
      this.waitForVirtualAdapter(surface, epoch, token, snapshot);
      return;
    }

    const context = { signal: abortController.signal, snapshot, surface };
    let readiness: NavigationScrollRestoreReadiness;

    try {
      readiness = adapter.getRestoreReadiness(context);
    } catch {
      this.applyFallback(surface, snapshot);
      this.completeRestore(epoch, surface);
      return;
    }
    if (readiness === "waiting") {
      this.waitForVirtualAdapter(surface, epoch, token, snapshot);
      return;
    }

    if (readiness === "unavailable") {
      this.applyFallback(surface, snapshot);
      this.completeRestore(epoch, surface);
      return;
    }

    if (this.adapterRestoreInFlightToken === token) return;
    this.adapterRestoreInFlightToken = token;

    Promise.resolve(adapter.restore(context))
      .then(() => {
        if (token !== this.restoreToken || !this.isCurrentRestore(epoch, surface)) return;
        this.completeRestore(epoch, surface);
      })
      .catch(() => {
        if (token !== this.restoreToken || !this.isCurrentRestore(epoch, surface)) return;
        this.applyFallback(surface, snapshot);
        this.completeRestore(epoch, surface);
      });
  }

  private scheduleRestoreCheck(token = this.restoreToken) {
    if (!this.window || this.restoreRaf !== null) return;

    this.restoreRaf = this.window.requestAnimationFrame(() => {
      this.restoreRaf = null;
      this.runRestoreCheck(token);
    });
  }

  private scheduleRestoreRetry(token: number) {
    if (!this.window || this.restoreRetryTimer !== null) return;

    this.restoreRetryTimer = this.window.setTimeout(() => {
      this.restoreRetryTimer = null;
      this.scheduleRestoreCheck(token);
    }, RESTORE_RETRY_DELAY_MS);
  }

  private setState(
    nextState: Partial<NavigationScrollCoordinatorState>,
    options: { deferNotification?: boolean } = {},
  ) {
    const state = { ...this.state, ...nextState };
    if (
      state.entryId === this.state.entryId &&
      state.isAtTop === this.state.isAtTop &&
      state.isRestoring === this.state.isRestoring
    ) {
      return;
    }

    this.state = state;
    if (options.deferNotification) {
      this.scheduleStateNotification();
      return;
    }

    if (this.stateNotificationRaf !== null && this.window) {
      this.window.cancelAnimationFrame(this.stateNotificationRaf);
      this.stateNotificationRaf = null;
    }
    this.onStateChange?.(state);
  }

  private scheduleStateNotification() {
    if (!this.onStateChange || !this.window || this.stateNotificationRaf !== null) return;

    this.stateNotificationRaf = this.window.requestAnimationFrame(() => {
      this.stateNotificationRaf = null;
      this.onStateChange?.(this.state);
    });
  }

  private updateAtTop(surface: HTMLDivElement) {
    this.setState({ isAtTop: surface.scrollTop <= AT_TOP_TOLERANCE_PX });
  }

  private waitForVirtualAdapter(
    surface: HTMLDivElement,
    epoch: number,
    token: number,
    snapshot: Extract<NavigationScrollSnapshot, { kind: "virtual-collection" }>,
  ) {
    if (Date.now() - this.restoreStartedAt < this.restoreTimeoutMs) {
      this.scheduleRestoreRetry(token);
      return;
    }

    this.applyFallback(surface, snapshot);
    this.completeRestore(epoch, surface);
  }
}
