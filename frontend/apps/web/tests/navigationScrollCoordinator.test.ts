import { expect, test } from "bun:test";
import { NavigationScrollCoordinator } from "@/lib/navigation-scroll/coordinator";
import { getNavigationScrollEntryId } from "@/lib/navigation-scroll/historyState";
import type {
  NavigationScrollSnapshot,
  NavigationScrollSnapshotRegistryLike,
} from "@/types/navigation-scroll";

class FakeScrollSurface extends EventTarget {
  clientHeight = 600;
  firstElementChild = null;
  scrollHeight = 3_000;
  scrollTop = 0;
}

function createRegistry() {
  const snapshots = new Map<string, NavigationScrollSnapshot>();
  const registry: NavigationScrollSnapshotRegistryLike = {
    delete(entryId) {
      snapshots.delete(entryId);
    },
    get(entryId) {
      return snapshots.get(entryId) ?? null;
    },
    set(entryId, snapshot) {
      snapshots.set(entryId, snapshot);
    },
  };

  return { registry, snapshots };
}

function createWindow() {
  const target = new EventTarget();
  let nextFrameId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const history = {
    scrollRestoration: "auto",
    state: null as unknown,
    pushState(data: unknown, _unused: string, _url?: string | URL | null) {
      this.state = data;
    },
    replaceState(data: unknown, _unused: string, _url?: string | URL | null) {
      this.state = data;
    },
  };

  return {
    addEventListener: target.addEventListener.bind(target),
    cancelAnimationFrame(frameId: number) {
      frames.delete(frameId);
    },
    clearTimeout,
    dispatchEvent: target.dispatchEvent.bind(target),
    flushAnimationFrames() {
      const pendingFrames = [...frames.values()];
      frames.clear();
      pendingFrames.forEach((callback) => callback(0));
    },
    history,
    removeEventListener: target.removeEventListener.bind(target),
    requestAnimationFrame(callback: FrameRequestCallback) {
      nextFrameId += 1;
      frames.set(nextFrameId, callback);
      return nextFrameId;
    },
    setTimeout,
  };
}

test("does not let a queued scroll capture overwrite a popstate snapshot", () => {
  const fakeWindow = createWindow();
  const { registry, snapshots } = createRegistry();
  const coordinator = new NavigationScrollCoordinator({
    registry,
    window: fakeWindow as unknown as Window,
  });
  const surface = new FakeScrollSurface();
  const snapshot: NavigationScrollSnapshot = {
    anchorKey: "26",
    anchorOffset: 94,
    fallbackTop: 1_800,
    kind: "virtual-collection",
  };

  coordinator.start();
  const playlistHistoryState = fakeWindow.history.state;
  const unregisterAdapter = coordinator.registerRestorationAdapter({
    capture: () => snapshot,
    getRestoreReadiness: () => "waiting",
    restore: () => undefined,
  });
  coordinator.registerSurface(surface as unknown as HTMLDivElement);

  surface.scrollTop = 1_800;
  surface.dispatchEvent(new Event("scroll"));
  fakeWindow.history.pushState({}, "", "/");
  unregisterAdapter();
  coordinator.registerSurface(null);
  coordinator.registerSurface(new FakeScrollSurface() as unknown as HTMLDivElement);
  fakeWindow.history.state = playlistHistoryState;
  fakeWindow.dispatchEvent(new Event("popstate"));
  coordinator.registerSurface(null);
  coordinator.registerSurface(new FakeScrollSurface() as unknown as HTMLDivElement);
  fakeWindow.flushAnimationFrames();

  const playlistEntryId = getNavigationScrollEntryId(playlistHistoryState);
  expect(playlistEntryId).not.toBeNull();
  expect(snapshots.get(playlistEntryId ?? "")).toEqual(snapshot);
});

test("keeps a popstate entry when Next replaces its route state", () => {
  const fakeWindow = createWindow();
  const { registry, snapshots } = createRegistry();
  const coordinator = new NavigationScrollCoordinator({
    registry,
    window: fakeWindow as unknown as Window,
  });
  const surface = new FakeScrollSurface();
  const snapshot: NavigationScrollSnapshot = {
    anchorKey: "26",
    anchorOffset: 94,
    fallbackTop: 1_800,
    kind: "virtual-collection",
  };

  coordinator.start();
  const playlistHistoryState = fakeWindow.history.state;
  coordinator.registerRestorationAdapter({
    capture: () => snapshot,
    getRestoreReadiness: () => "waiting",
    restore: () => undefined,
  });
  coordinator.registerSurface(surface as unknown as HTMLDivElement);
  fakeWindow.history.pushState({}, "", "/");

  fakeWindow.history.state = playlistHistoryState;
  fakeWindow.dispatchEvent(new Event("popstate"));
  fakeWindow.history.replaceState({}, "", "/playlist/?id=14063254342&isRecommend=true");

  const playlistEntryId = getNavigationScrollEntryId(playlistHistoryState);
  expect(getNavigationScrollEntryId(fakeWindow.history.state)).toBe(playlistEntryId);
  expect(snapshots.get(playlistEntryId ?? "")).toEqual(snapshot);
});

test("restores a query-only popstate without waiting for the scroll surface to remount", () => {
  const fakeWindow = createWindow();
  const { registry } = createRegistry();
  const observedRestoringStates: boolean[] = [];
  const coordinator = new NavigationScrollCoordinator({
    onStateChange(state) {
      observedRestoringStates.push(state.isRestoring);
    },
    registry,
    window: fakeWindow as unknown as Window,
  });
  const surface = new FakeScrollSurface();

  coordinator.start();
  coordinator.registerSurface(surface as unknown as HTMLDivElement);
  const podcastsSearchHistoryState = fakeWindow.history.state;

  surface.scrollTop = 900;
  fakeWindow.history.pushState({}, "", "/search/?keywords=next&tab=Songs");
  surface.scrollTop = 0;

  fakeWindow.history.state = podcastsSearchHistoryState;
  fakeWindow.dispatchEvent(new Event("popstate"));
  fakeWindow.flushAnimationFrames();

  expect(surface.scrollTop).toBe(900);
  expect(observedRestoringStates.at(-1)).toBe(false);
});

test("does not synchronously notify React state observers from history writes", () => {
  const fakeWindow = createWindow();
  const { registry } = createRegistry();
  let isHistoryWriteInRestrictedPhase = false;
  const observedStates: Array<{ entryId: string | null }> = [];
  const coordinator = new NavigationScrollCoordinator({
    onStateChange(state) {
      if (isHistoryWriteInRestrictedPhase) {
        throw new Error("React state observer was notified during a history write");
      }
      observedStates.push({ entryId: state.entryId });
    },
    registry,
    window: fakeWindow as unknown as Window,
  });

  coordinator.start();
  isHistoryWriteInRestrictedPhase = true;
  expect(() => fakeWindow.history.pushState({}, "", "/playlist/?id=1")).not.toThrow();
  isHistoryWriteInRestrictedPhase = false;

  expect(observedStates).toHaveLength(1);
  fakeWindow.flushAnimationFrames();
  expect(observedStates).toHaveLength(2);
});
