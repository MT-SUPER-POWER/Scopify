import { afterAll, expect, mock, test } from "bun:test";
import { EventEmitter } from "node:events";
import type { PlaybackProjection } from "@scopify/desktop-contract";
import type { MacTrayOptions } from "../types/tray";

const trays: FakeTray[] = [];
class FakeTray extends EventEmitter {
  image: unknown;
  tooltip = "";
  title = "";
  ignoreDoubleClick = false;
  destroyed = false;
  constructor(image: unknown) {
    super();
    this.image = image;
    trays.push(this);
  }
  setImage(image: unknown) {
    this.image = image;
  }
  setToolTip(text: string) {
    this.tooltip = text;
  }
  setIgnoreDoubleClickEvents(value: boolean) {
    this.ignoreDoubleClick = value;
  }
  setTitle(text: string) {
    this.title = text;
  }
  isDestroyed() {
    return this.destroyed;
  }
  destroy() {
    this.destroyed = true;
  }
}

const image = (path = "") => ({
  path,
  isEmpty: () => true,
  resize() {
    return this;
  },
  setTemplateImage() {},
});
mock.module("electron", () => ({
  app: { getLocale: () => "en-US", dock: { setMenu() {} }, once() {} },
  Tray: FakeTray,
  Menu: { buildFromTemplate: (template: unknown) => template },
  nativeImage: {
    createFromPath: image,
    createEmpty: image,
    createFromBitmap: (pixels: Buffer, options: unknown) => ({
      pixels,
      options,
      setTemplateImage() {},
    }),
  },
  net: {},
}));
mock.module("../electron/main/constants", () => ({
  __iconMenuBarSourcePath: "logo.png",
  __iconTray: image(),
  __menuBarIconDir: "/icons",
}));
mock.module("../electron/main/utils/logger", () => ({ trayLog: { error() {}, warn() {} } }));
mock.module("../electron/main/utils/userDataJson", () => ({
  isRecord: (value: unknown) => value !== null && typeof value === "object",
  readUserDataJson: () => null,
  writeUserDataJson() {},
}));
mock.module("../electron/main/window/desktopLyric", () => ({
  getDesktopLyricPreferences: () => ({ enabled: false, locked: false }),
  setDesktopLyricLocked() {},
  toggleDesktopLyricWindow() {},
}));
mock.module("../electron/main/window/dynamicIsland", () => ({
  getDynamicIslandWindow: () => null,
  toggleDynamicIslandWindow() {},
}));
mock.module("../electron/main/service/desktop/wallpaper", () => ({
  isDesktopPlaybackControllerOpen: () => false,
  toggleDesktopPlaybackController() {},
}));

mock.module("../electron/main/service/renderer/menuBarText", () => ({
  renderMenuBarText: async (text: string) => {
    const width = Array.from(text).length * 20;
    const pixels = Buffer.alloc(width * 4);
    for (let column = 0; column < width; column += 1) pixels[column * 4] = column % 256;
    return { width, height: 1, viewportWidth: Math.min(width, 600), pixels };
  },
  disposeMenuBarTextRenderer() {},
}));

const { initMacTray, disposeMacTray } = await import("../electron/main/window/macTray");
const originalPlatform = process.platform;
const systemVersionDescriptor = Object.getOwnPropertyDescriptor(process, "getSystemVersion");
afterAll(() => {
  disposeMacTray();
  Object.defineProperty(process, "platform", { value: originalPlatform });
  if (systemVersionDescriptor) {
    Object.defineProperty(process, "getSystemVersion", systemVersionDescriptor);
  } else {
    Reflect.deleteProperty(process, "getSystemVersion");
  }
  mock.restore();
});

test("menu bar controls have separate native targets, actions, state and cleanup", async () => {
  Object.defineProperty(process, "platform", { value: "darwin" });
  Object.defineProperty(process, "getSystemVersion", { value: () => "15.0", configurable: true });
  let snapshot = {
    track: { id: "1", title: "Track", artistNames: ["Artist"] },
    isPlaying: false,
    liked: false,
    canControl: true,
  } as PlaybackProjection;
  let refresh = () => {};
  const previous = mock(() => {});
  const toggle = mock(() => {});
  const next = mock(() => {});
  const dispatch = mock(() => {});
  const unsubscribe = mock(() => {});
  const options = {
    playback: {
      getSnapshot: () => snapshot,
      previous,
      toggle,
      next,
      dispatch,
      subscribe: (listener: () => void) => {
        refresh = listener;
        return unsubscribe;
      },
    },
    getPlaybackAnchor: () => null,
    getWallpaperService: () => null,
    showMainWindow() {},
  } as unknown as MacTrayOptions;
  initMacTray(options);
  // Native status items appear in reverse creation order, with the title on the left.
  expect(trays).toHaveLength(6);
  const [logo, like, nextButton, play, previousButton, title] = trays;
  expect(trays.slice(1, 5).map((tray) => tray.tooltip)).toEqual([
    "Like",
    "Next",
    "Play",
    "Previous",
  ]);
  for (const button of [like, nextButton, play, previousButton]) {
    expect(button.ignoreDoubleClick).toBe(true);
  }
  previousButton.emit("click");
  play.emit("click");
  nextButton.emit("click");
  nextButton.emit("click");
  like.emit("click");
  await Promise.resolve();
  expect(previous).toHaveBeenCalledTimes(1);
  expect(toggle).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledTimes(2);
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith({ type: "toggle-like" });

  snapshot = { ...snapshot, isPlaying: true, liked: true };
  refresh();
  expect(trays).toHaveLength(6);
  expect(play.image).toMatchObject({ path: "/icons/pauseTemplate.png" });
  expect(like.image).toMatchObject({ path: "/icons/heartFilledTemplate.png" });
  expect(play.tooltip).toBe("Pause");
  expect(like.tooltip).toBe("Unlike");

  snapshot = { ...snapshot, isPlaying: false, liked: false };
  refresh();
  expect(trays).toHaveLength(6);
  expect(play.image).toMatchObject({ path: "/icons/playTemplate.png" });
  expect(like.image).toMatchObject({ path: "/icons/heartTemplate.png" });
  expect(play.tooltip).toBe("Play");
  expect(like.tooltip).toBe("Like");

  const longLine = "0123456789abcdefghijklmnopqrstuvwxyz";
  snapshot = {
    ...snapshot,
    isPlaying: true,
    positionMs: 0,
    lyricsVersion: "scroll-test",
    lyrics: {
      lines: [
        { startTimeMs: 0, text: longLine },
        { startTimeMs: 3000, text: "下一句" },
      ],
    },
  };
  refresh();
  await Promise.resolve();
  expect(title.title).toBe("");
  expect(title.image).toMatchObject({ options: { width: 600, scaleFactor: 2 } });
  const initialImage = title.image;
  snapshot = { ...snapshot, positionMs: 1200 };
  refresh();
  expect(title.image).toBe(initialImage);
  snapshot = { ...snapshot, isPlaying: false };
  refresh();
  expect(title.image).toBe(initialImage);
  snapshot = { ...snapshot, isPlaying: true, positionMs: 1440 };
  refresh();
  expect(title.image).not.toBe(initialImage);
  expect((title.image as { pixels: Buffer }).pixels[0]).toBe(12);
  // Small playback-clock corrections must not restart the opening hold.
  snapshot = { ...snapshot, positionMs: 1430 };
  refresh();
  expect((title.image as { pixels: Buffer }).pixels[0]).toBe(11);
  snapshot = { ...snapshot, positionMs: 3000 };
  refresh();
  await Promise.resolve();
  expect(title.image).toMatchObject({ options: { width: 60 } });
  snapshot = { ...snapshot, positionMs: 0 };
  refresh();
  await Promise.resolve();
  expect((title.image as { pixels: Buffer }).pixels[0]).toBe(0);

  snapshot = { ...snapshot, track: null };
  refresh();
  expect(
    [logo, like, nextButton, play, previousButton, title].every((tray) => tray.destroyed),
  ).toBe(true);
  expect(trays).toHaveLength(7);
  disposeMacTray();
  expect(trays.every((tray) => tray.destroyed)).toBe(true);
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
