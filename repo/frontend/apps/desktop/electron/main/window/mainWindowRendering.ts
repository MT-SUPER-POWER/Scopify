import type { MainWindowRenderingPolicy, MainWindowRenderingTarget } from "@/types/electronWindow";

/**
 * Stops a hidden main window from drawing frames while playback keeps running.
 *
 * The main window is created with `backgroundThrottling: false`, so a hidden window keeps
 * painting at the display refresh rate. Re-enabling throttling only after `hide` lets Electron
 * halt the window compositor (rAF, CSS animations and paints stall) while the page stays
 * "visible" and its timers stay unthrottled. Enabling it before `hide` would instead mark the
 * page hidden and throttle timers, so `shown` always restores the creation-time setting.
 */
export function createMainWindowRenderingPolicy(
  target: MainWindowRenderingTarget,
): MainWindowRenderingPolicy {
  let hidden = false;
  let keepAlive = false;
  let suspended = false;

  const apply = () => {
    const next = hidden && !keepAlive;
    if (next === suspended) return;
    suspended = next;
    target.setBackgroundThrottling(next);
  };

  return {
    hidden() {
      hidden = true;
      apply();
    },
    setKeepAlive(next) {
      keepAlive = next;
      apply();
    },
    shown() {
      hidden = false;
      apply();
    },
  };
}
