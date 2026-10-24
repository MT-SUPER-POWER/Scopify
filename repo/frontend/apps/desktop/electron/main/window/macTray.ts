import { __iconMenuBarSourcePath, __iconTray } from "@main/constants";
import { app, Menu, nativeImage, Tray, type MenuItemConstructorOptions } from "electron";
import type { PlaybackProjection } from "@scopify/desktop-contract";
import type { MacTrayLocale, MacTrayOptions } from "@/types/tray";
import { trayLog } from "@main/utils/logger";
import {
  getDesktopLyricPreferences,
  setDesktopLyricLocked,
  toggleDesktopLyricWindow,
} from "@main/window/desktopLyric";
import { getDynamicIslandWindow, toggleDynamicIslandWindow } from "@main/window/dynamicIsland";
import {
  isDesktopPlaybackControllerOpen,
  toggleDesktopPlaybackController,
} from "@main/service/desktop/wallpaper";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 菜单栏图标标准高度 18pt，@2x 位图 36px。 */
const MENU_BAR_ICON_SIZE = 18;
/** 菜单里歌名过长会把整列撑宽，超出部分省略。 */
const MAX_TITLE_LENGTH = 48;

const COPY = {
  "zh-CN": {
    nowPlaying: "正在播放",
    nothingPlaying: "未在播放",
    unknownArtist: "未知歌手",
    play: "播放",
    pause: "暂停",
    previous: "上一首",
    next: "下一首",
    like: "喜欢",
    unlike: "取消喜欢",
    desktopLyrics: "桌面歌词",
    lockDesktopLyrics: "锁定桌面歌词",
    dynamicIsland: "灵动岛",
    desktopWallpaper: "桌面动态壁纸",
    desktopController: "桌面音乐控制器",
    showMainWindow: "显示主窗口",
    settings: "设置…",
    quit: "退出 Scopify",
  },
  "zh-TW": {
    nowPlaying: "正在播放",
    nothingPlaying: "未在播放",
    unknownArtist: "未知歌手",
    play: "播放",
    pause: "暫停",
    previous: "上一首",
    next: "下一首",
    like: "喜歡",
    unlike: "取消喜歡",
    desktopLyrics: "桌面歌詞",
    lockDesktopLyrics: "鎖定桌面歌詞",
    dynamicIsland: "靈動島",
    desktopWallpaper: "桌面動態桌布",
    desktopController: "桌面音樂控制器",
    showMainWindow: "顯示主視窗",
    settings: "設定…",
    quit: "結束 Scopify",
  },
  "en-US": {
    nowPlaying: "Now Playing",
    nothingPlaying: "Not Playing",
    unknownArtist: "Unknown Artist",
    play: "Play",
    pause: "Pause",
    previous: "Previous",
    next: "Next",
    like: "Like",
    unlike: "Unlike",
    desktopLyrics: "Desktop Lyrics",
    lockDesktopLyrics: "Lock Desktop Lyrics",
    dynamicIsland: "Dynamic Island",
    desktopWallpaper: "Desktop Wallpaper",
    desktopController: "Desktop Controller",
    showMainWindow: "Show Main Window",
    settings: "Settings…",
    quit: "Quit Scopify",
  },
} satisfies Record<MacTrayLocale, Record<string, string>>;

type MacTrayCopy = (typeof COPY)[MacTrayLocale];

// Electron 原生对象必须保留强引用，否则垃圾回收会让菜单栏图标提前消失。
let tray: Tray | null = null;
let unsubscribePlayback: (() => void) | null = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FUNCTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function resolveLocale(): MacTrayLocale {
  const locale = app.getLocale();
  if (!locale.toLowerCase().startsWith("zh")) return "en-US";
  return /TW|HK|MO|Hant/i.test(locale) ? "zh-TW" : "zh-CN";
}

function truncate(text: string) {
  return text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH - 1)}…` : text;
}

/**
 * 应用图标是彩色圆形徽章，直接放进菜单栏既过大也不随深浅色切换。
 * 取深色笔画（外圈与 S）生成单色 Template Image，交给系统按菜单栏外观着色。
 */
function createMenuBarIcon() {
  const pixelSize = MENU_BAR_ICON_SIZE * 2;
  const source = nativeImage
    .createFromPath(__iconMenuBarSourcePath)
    .resize({ width: pixelSize, height: pixelSize, quality: "best" });
  if (source.isEmpty()) {
    trayLog.error("[mac-tray] failed to load menu bar icon source", __iconMenuBarSourcePath);
    return __iconTray.resize({ height: MENU_BAR_ICON_SIZE });
  }

  const bitmap = source.toBitmap();
  for (let offset = 0; offset < bitmap.length; offset += 4) {
    const luminance = (bitmap[offset] + bitmap[offset + 1] + bitmap[offset + 2]) / 3;
    const ink = Math.min(1, Math.max(0, (170 - luminance) / 70));
    const alpha = Math.round(bitmap[offset + 3] * ink);
    bitmap[offset] = 0;
    bitmap[offset + 1] = 0;
    bitmap[offset + 2] = 0;
    bitmap[offset + 3] = alpha;
  }

  const icon = nativeImage.createFromBitmap(bitmap, {
    width: pixelSize,
    height: pixelSize,
    scaleFactor: 2,
  });
  icon.setTemplateImage(true);
  return icon;
}

function describeTrack(snapshot: PlaybackProjection | null, copy: MacTrayCopy) {
  const track = snapshot?.track;
  if (!track) return null;
  const artists = track.artistNames.join(" / ") || copy.unknownArtist;
  return { title: truncate(track.title), artists: truncate(artists) };
}

function run(label: string, action: () => unknown) {
  void Promise.resolve()
    .then(action)
    .catch((error) => trayLog.error(`[mac-tray] ${label} failed`, error));
}

/** 菜单栏与 Dock 共用的播放控制段。 */
function buildPlaybackItems(
  options: MacTrayOptions,
  copy: MacTrayCopy,
): MenuItemConstructorOptions[] {
  const snapshot = options.playback.getSnapshot();
  const track = describeTrack(snapshot, copy);
  const canControl = Boolean(snapshot?.canControl && track);

  return [
    track
      ? { label: copy.nowPlaying, enabled: false }
      : { label: copy.nothingPlaying, enabled: false },
    ...(track
      ? ([
          { label: track.title, enabled: false },
          { label: track.artists, enabled: false },
        ] satisfies MenuItemConstructorOptions[])
      : []),
    { type: "separator" },
    {
      label: snapshot?.isPlaying ? copy.pause : copy.play,
      enabled: canControl,
      click: () => run("toggle", options.playback.toggle),
    },
    {
      label: copy.previous,
      enabled: canControl,
      click: () => run("previous", options.playback.previous),
    },
    {
      label: copy.next,
      enabled: canControl,
      click: () => run("next", options.playback.next),
    },
    {
      label: snapshot?.liked ? copy.unlike : copy.like,
      type: "checkbox",
      checked: Boolean(snapshot?.liked),
      enabled: canControl,
      click: () => run("toggle-like", () => options.playback.dispatch({ type: "toggle-like" })),
    },
  ];
}

/** 菜单栏菜单每次点开时现建，开关状态始终与各窗口实际状态一致。 */
function buildStatusMenu(options: MacTrayOptions) {
  const copy = COPY[resolveLocale()];
  const lyric = getDesktopLyricPreferences();
  const wallpaper = options.getWallpaperService();
  const wallpaperEnabled = wallpaper?.getModel().preferences.enabled ?? false;

  const template: MenuItemConstructorOptions[] = [
    ...buildPlaybackItems(options, copy),
    { type: "separator" },
    {
      label: copy.desktopLyrics,
      type: "checkbox",
      checked: lyric.enabled,
      click: () => run("toggle desktop lyrics", toggleDesktopLyricWindow),
    },
    {
      label: copy.lockDesktopLyrics,
      type: "checkbox",
      checked: lyric.locked,
      visible: lyric.enabled,
      click: () => run("lock desktop lyrics", () => setDesktopLyricLocked(!lyric.locked)),
    },
    {
      label: copy.dynamicIsland,
      type: "checkbox",
      checked: getDynamicIslandWindow() !== null,
      click: () => run("toggle dynamic island", toggleDynamicIslandWindow),
    },
    {
      label: copy.desktopWallpaper,
      type: "checkbox",
      checked: wallpaperEnabled,
      enabled: wallpaper !== null,
      click: () =>
        run("toggle desktop wallpaper", () => wallpaper?.configure({ enabled: !wallpaperEnabled })),
    },
    {
      label: copy.desktopController,
      type: "checkbox",
      checked: isDesktopPlaybackControllerOpen(),
      click: () => run("toggle desktop controller", toggleDesktopPlaybackController),
    },
    { type: "separator" },
    {
      label: copy.showMainWindow,
      click: () => run("show main window", options.showMainWindow),
    },
    {
      label: copy.settings,
      accelerator: "Command+,",
      click: () => run("open settings", () => options.showMainWindow("/setting")),
    },
    { type: "separator" },
    { label: copy.quit, accelerator: "Command+Q", click: () => app.quit() },
  ];
  return Menu.buildFromTemplate(template);
}

/** Dock 菜单是静态快照，只放播放控制；系统会自动追加“显示所有窗口 / 隐藏 / 退出”。 */
function buildDockMenu(options: MacTrayOptions) {
  return Menu.buildFromTemplate(buildPlaybackItems(options, COPY[resolveLocale()]));
}

function getMenuSignature(snapshot: PlaybackProjection | null) {
  const track = snapshot?.track;
  return JSON.stringify([
    track?.id ?? null,
    track?.title ?? null,
    track?.artistNames ?? null,
    snapshot?.isPlaying ?? false,
    snapshot?.liked ?? false,
    snapshot?.canControl ?? false,
  ]);
}

/**
 * 初始化 macOS 菜单栏图标与 Dock 右键菜单。重复调用保持幂等。
 * 菜单栏左右键都弹出原生菜单，符合 macOS 状态栏习惯；Dock 菜单随播放状态刷新。
 */
export function initMacTray(options: MacTrayOptions) {
  if (process.platform !== "darwin" || tray) return;

  tray = new Tray(createMenuBarIcon());
  tray.setToolTip("Scopify");

  const popUp = () => {
    if (!tray || tray.isDestroyed()) return;
    tray.popUpContextMenu(buildStatusMenu(options));
  };
  tray.on("click", popUp);
  tray.on("right-click", popUp);

  let signature: string | null = null;
  const refresh = (snapshot: PlaybackProjection | null) => {
    const nextSignature = getMenuSignature(snapshot);
    if (nextSignature === signature) return;
    signature = nextSignature;

    const track = describeTrack(snapshot, COPY[resolveLocale()]);
    tray?.setToolTip(track ? `${track.title} - ${track.artists}` : "Scopify");
    app.dock?.setMenu(buildDockMenu(options));
  };
  refresh(options.playback.getSnapshot());
  unsubscribePlayback = options.playback.subscribe(refresh);

  app.once("before-quit", disposeMacTray);
}

export function disposeMacTray() {
  unsubscribePlayback?.();
  unsubscribePlayback = null;
  if (tray && !tray.isDestroyed()) tray.destroy();
  tray = null;
}
