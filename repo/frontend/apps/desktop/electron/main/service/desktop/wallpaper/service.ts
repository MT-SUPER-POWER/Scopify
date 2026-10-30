import type {
  DesktopPlaybackWallpaperReconcileReason,
  DesktopPlaybackWallpaperService,
  DesktopPlaybackWallpaperServiceOptions,
} from "@/types/service/desktop/wallpaper/service";
export type {
  DesktopPlaybackWallpaperReconcileReason,
  DesktopPlaybackWallpaperDriver,
  DesktopPlaybackControllerLauncher,
  DesktopPlaybackWallpaperService,
  DesktopPlaybackWallpaperServiceOptions,
} from "@/types/service/desktop/wallpaper/service";
import type { DesktopPlaybackWallpaperModel } from "@scopify/desktop-contract";

import {
  applyDesktopPlaybackWallpaperPreferencesUpdate,
  cloneDesktopPlaybackWallpaperPreferences,
} from "@/types/desktopPlaybackWallpaper";

import {
  cloneDesktopPlaybackWallpaperModel,
  createDesktopPlaybackWallpaperModel,
  getInactiveDesktopPlaybackWallpaperStatus,
  transitionDesktopPlaybackWallpaper,
} from "./stateMachine";
import type { DesktopPlaybackWallpaperSettledStatus } from "@/types/service/desktop/wallpaper/stateMachine";

export function createDesktopPlaybackWallpaperService({
  controller,
  driver,
  onError = () => undefined,
  preferences: preferencesRepository,
}: DesktopPlaybackWallpaperServiceOptions): DesktopPlaybackWallpaperService {
  let model = createDesktopPlaybackWallpaperModel(preferencesRepository.load());
  let operationRevision = 0;
  let activeController: AbortController | null = null;
  const listeners = new Set<(model: DesktopPlaybackWallpaperModel) => void>();

  const notify = () => {
    listeners.forEach((listener) => listener(cloneDesktopPlaybackWallpaperModel(model)));
  };

  const reconcile = async (
    reason: DesktopPlaybackWallpaperReconcileReason,
  ): Promise<DesktopPlaybackWallpaperModel> => {
    operationRevision += 1;
    const revision = operationRevision;
    activeController?.abort();
    activeController = new AbortController();
    const signal = activeController.signal;
    const inactiveStatus = getInactiveDesktopPlaybackWallpaperStatus(model.preferences);

    if (!inactiveStatus && model.status.state !== "starting") {
      model = transitionDesktopPlaybackWallpaper(model, { type: "start-requested" });
      notify();
    }

    try {
      const status = await driver.reconcile(
        cloneDesktopPlaybackWallpaperPreferences(model.preferences),
        { reason, signal },
      );
      if (signal.aborted || revision !== operationRevision)
        return cloneDesktopPlaybackWallpaperModel(model);

      if (!getInactiveDesktopPlaybackWallpaperStatus(model.preferences)) {
        const settledStatus =
          status ??
          ({
            diagnostic: "The desktop playback wallpaper driver returned no active status.",
            retryable: true,
            state: "faulted",
          } satisfies DesktopPlaybackWallpaperSettledStatus);

        if (settledStatus.state === "faulted") {
          onError(
            `Desktop playback wallpaper driver reported fault: ${settledStatus.diagnostic ?? "unknown"}`,
            new Error(settledStatus.diagnostic ?? "Wallpaper driver reported fault"),
          );
        }

        model = transitionDesktopPlaybackWallpaper(model, {
          status: settledStatus,
          type: "runtime-settled",
        });
        notify();
      }
    } catch (error) {
      if (signal.aborted || revision !== operationRevision)
        return cloneDesktopPlaybackWallpaperModel(model);
      onError("Desktop playback wallpaper reconcile failed.", error);

      if (!getInactiveDesktopPlaybackWallpaperStatus(model.preferences)) {
        model = transitionDesktopPlaybackWallpaper(model, {
          status: {
            diagnostic: error instanceof Error ? error.message : String(error),
            retryable: true,
            state: "faulted",
          },
          type: "runtime-settled",
        });
        notify();
      }
    }

    return cloneDesktopPlaybackWallpaperModel(model);
  };

  return {
    async configure(update) {
      const nextPreferences = applyDesktopPlaybackWallpaperPreferencesUpdate(
        model.preferences,
        update,
      );
      preferencesRepository.save(nextPreferences);
      model = transitionDesktopPlaybackWallpaper(model, {
        preferences: nextPreferences,
        type: "preferences-updated",
      });
      notify();
      return reconcile("configure");
    },

    async dispose() {
      operationRevision += 1;
      activeController?.abort();
      activeController = null;
      listeners.clear();
      await driver.dispose?.();
    },

    getModel() {
      return cloneDesktopPlaybackWallpaperModel(model);
    },

    initialize() {
      notify();
      return reconcile("initialize");
    },

    retry() {
      if (getInactiveDesktopPlaybackWallpaperStatus(model.preferences)) {
        return Promise.resolve(cloneDesktopPlaybackWallpaperModel(model));
      }
      return reconcile("retry");
    },

    async showController() {
      if (!controller) return { opened: false, reason: "unavailable" };

      try {
        return await controller.show();
      } catch (error) {
        onError("Desktop playback controller failed to open.", error);
        return { opened: false, reason: "failed" };
      }
    },

    subscribe(listener) {
      listeners.add(listener);
      listener(cloneDesktopPlaybackWallpaperModel(model));
      return () => listeners.delete(listener);
    },
  };
}
