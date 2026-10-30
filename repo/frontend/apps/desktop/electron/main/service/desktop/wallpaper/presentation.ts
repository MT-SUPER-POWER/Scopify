import type { BrowserWindow, Rectangle } from "electron";

const WALLPAPER_PRESENTATION_READY_SELECTOR =
  '[data-desktop-playback-wallpaper-content-ready="true"]';

export async function waitForWallpaperPresentation(window: BrowserWindow, signal: AbortSignal) {
  throwIfAborted(signal);
  if (!window.webContents.getURL() || window.webContents.isLoadingMainFrame()) {
    await waitForMainFrame(window, signal);
  }
  const ready = await window.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const deadline = performance.now() + 5000;
      let settled = false;
      let timer = null;
      const done = (value) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        resolve(value);
      };
      const check = () => {
        if (settled) return;
        if (document.querySelector(${JSON.stringify(WALLPAPER_PRESENTATION_READY_SELECTOR)})) {
          done(true);
          return;
        }
        if (performance.now() >= deadline) {
          done(false);
          return;
        }
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(check);
        }
        timer = setTimeout(check, 50);
      };
      check();
    })
  `);
  throwIfAborted(signal);
  if (ready !== true) {
    throw new Error("The main Renderer did not enter its Stage-only wallpaper presentation.");
  }
}

function waitForMainFrame(window: BrowserWindow, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
      window.webContents.removeListener("did-fail-load", onFail);
      window.webContents.removeListener("did-finish-load", onReady);
    };
    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };
    const onFail = (_event: Electron.Event, code: number, description: string) => {
      cleanup();
      reject(new Error(`The main Renderer failed to load (${code}): ${description}`));
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    signal.addEventListener("abort", onAbort, { once: true });
    window.webContents.once("did-fail-load", onFail);
    window.webContents.once("did-finish-load", onReady);
  });
}

export async function waitForExactWallpaperContentBounds(
  window: BrowserWindow,
  targetBounds: Rectangle,
  signal: AbortSignal,
) {
  const deadline = Date.now() + 2_000;
  let contentBounds = window.getContentBounds();
  while (!rectanglesMatch(contentBounds, targetBounds) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    throwIfAborted(signal);
    contentBounds = window.getContentBounds();
  }
  if (!rectanglesMatch(contentBounds, targetBounds)) {
    throw new Error(
      `Wallpaper content bounds ${JSON.stringify(contentBounds)} do not cover display ${JSON.stringify(targetBounds)}.`,
    );
  }
  return contentBounds;
}

function rectanglesMatch(left: Rectangle, right: Rectangle) {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
}

export function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw createAbortError();
}

export function createAbortError() {
  const error = new Error("Desktop playback wallpaper operation was cancelled.");
  error.name = "AbortError";
  return error;
}
