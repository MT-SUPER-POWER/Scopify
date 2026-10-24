import { join } from "node:path";
import { __iconMenuBarSourcePath, __iconTray, __menuBarIconDir } from "@main/constants";
import {
  app,
  Menu,
  nativeImage,
  net,
  Tray,
  type MenuItemConstructorOptions,
  type NativeImage,
} from "electron";
import type { PlaybackProjection } from "@scopify/desktop-contract";
import type { MacMenuBarDisplayMode, MacTrayLocale, MacTrayOptions } from "@/types/tray";
import { trayLog } from "@main/utils/logger";
import { isRecord, readUserDataJson, writeUserDataJson } from "@main/utils/userDataJson";
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
const MAX_MENU_TEXT_LENGTH = 48;
/** 菜单栏文字占的是所有应用共享的空间，按档位收得更紧。 */
const MAX_STATUS_TEXT_LENGTH: Record<"full" | "compact", number> = { full: 28, compact: 18 };
/** 菜单头部封面 32pt，按 @2x 取 64px。 */
const COVER_SIZE = 32;
const PREFERENCES_FILE = "mac-menu-bar.json";
const DISPLAY_MODES: MacMenuBarDisplayMode[] = ["full", "compact", "controls", "icon"];
const DEFAULT_DISPLAY_MODE: MacMenuBarDisplayMode = "full";

const COPY = {
  "zh-CN": {
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
    menuBarDisplay: "菜单栏显示",
    displayFull: "歌名与歌手",
    displayCompact: "仅歌名",
    displayControls: "仅播放控制",
    displayIcon: "仅图标",
    showMainWindow: "显示主窗口",
    settings: "设置…",
    quit: "退出 Scopify",
  },
  "zh-TW": {
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
    menuBarDisplay: "選單列顯示",
    displayFull: "歌名與歌手",
    displayCompact: "僅歌名",
    displayControls: "僅播放控制",
    displayIcon: "僅圖示",
    showMainWindow: "顯示主視窗",
    settings: "設定…",
    quit: "結束 Scopify",
  },
  "en-US": {
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
    menuBarDisplay: "Menu Bar Display",
    displayFull: "Title and Artist",
    displayCompact: "Title Only",
    displayControls: "Controls Only",
    displayIcon: "Icon Only",
    showMainWindow: "Show Main Window",
    settings: "Settings…",
    quit: "Quit Scopify",
  },
} satisfies Record<MacTrayLocale, Record<string, string>>;

type MacTrayCopy = (typeof COPY)[MacTrayLocale];

const DISPLAY_MODE_LABEL: Record<MacMenuBarDisplayMode, keyof MacTrayCopy> = {
  full: "displayFull",
  compact: "displayCompact",
  controls: "displayControls",
  icon: "displayIcon",
};

/**
 * 菜单栏里每个按钮都是独立的 NSStatusItem。系统把后创建的放在左侧，
 * 所以按 logo → 喜欢 → 下一首 → 播放 → 上一首 → 歌名 的顺序创建，
 * 得到与网易云一致的「歌名 ⏮ ⏯ ⏭ ♡ logo」排列。
 */
interface StatusItems {
  logo: Tray;
  like: Tray | null;
  next: Tray | null;
  toggle: Tray | null;
  previous: Tray | null;
  title: Tray | null;
}

interface CoverCache {
  url: string;
  image: NativeImage | null;
}

// Electron 原生对象必须保留强引用，否则垃圾回收会让菜单栏图标提前消失。
let items: StatusItems | null = null;
let layoutKey: string | null = null;
let statusSignature: string | null = null;
let displayMode: MacMenuBarDisplayMode | null = null;
let cover: CoverCache | null = null;
let cleanups: (() => void)[] = [];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FUNCTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function resolveLocale(): MacTrayLocale {
  const locale = app.getLocale();
  if (!locale.toLowerCase().startsWith("zh")) return "en-US";
  return /TW|HK|MO|Hant/i.test(locale) ? "zh-TW" : "zh-CN";
}

function getCopy() {
  return COPY[resolveLocale()];
}

function truncate(text: string, max = MAX_MENU_TEXT_LENGTH) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function getDisplayMode() {
  if (displayMode) return displayMode;
  const parsed = readUserDataJson(PREFERENCES_FILE, trayLog);
  const stored = isRecord(parsed) ? parsed.displayMode : null;
  displayMode = DISPLAY_MODES.includes(stored as MacMenuBarDisplayMode)
    ? (stored as MacMenuBarDisplayMode)
    : DEFAULT_DISPLAY_MODE;
  return displayMode;
}

function setDisplayMode(mode: MacMenuBarDisplayMode) {
  displayMode = mode;
  writeUserDataJson(PREFERENCES_FILE, { displayMode: mode }, trayLog);
}

/** 菜单项副标题需要 macOS 14.4+，更早的系统把歌手并进主标题。 */
function supportsSublabel() {
  const [major = 0, minor = 0] = process.getSystemVersion().split(".").map(Number);
  return major > 14 || (major === 14 && minor >= 4);
}

/**
 * 应用图标是彩色圆形徽章，直接放进菜单栏既过大也不随深浅色切换。
 * 取深色笔画（外圈与 S）生成单色 Template Image，交给系统按菜单栏外观着色。
 */
function createLogoIcon() {
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

const controlIcons = new Map<string, NativeImage>();

/** 文件名以 Template 结尾，macOS 自动按模板图处理并加载同目录 @2x。 */
function getControlIcon(name: "heart" | "heartFilled" | "next" | "pause" | "play" | "prev") {
  let icon = controlIcons.get(name);
  if (!icon) {
    icon = nativeImage.createFromPath(join(__menuBarIconDir, `${name}Template.png`));
    icon.setTemplateImage(true);
    if (icon.isEmpty()) trayLog.error("[mac-tray] failed to load control icon", name);
    controlIcons.set(name, icon);
  }
  return icon;
}

function describeTrack(snapshot: PlaybackProjection | null, copy: MacTrayCopy) {
  const track = snapshot?.track;
  if (!track) return null;
  return {
    title: track.title,
    artists: track.artistNames.join(" / ") || copy.unknownArtist,
    artworkUrl: track.artworkUrl ?? null,
  };
}

function run(label: string, action: () => unknown) {
  void Promise.resolve()
    .then(action)
    .catch((error) => trayLog.error(`[mac-tray] ${label} failed`, error));
}

function toggleLike(options: MacTrayOptions) {
  return options.playback.dispatch({ type: "toggle-like" });
}

// ─── 封面 ───

/** 网易云图床支持按参数裁切，取小图省流量；其他来源原样请求。 */
function resolveCoverUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith("music.126.net")) {
      parsed.protocol = "https:";
      parsed.searchParams.set("param", `${COVER_SIZE * 2}y${COVER_SIZE * 2}`);
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

async function loadCover(url: string) {
  const response = await net.fetch(url);
  if (!response.ok) throw new Error(`cover request failed: ${response.status}`);
  const source = nativeImage.createFromBuffer(Buffer.from(await response.arrayBuffer()));
  if (source.isEmpty()) return null;
  const pixels = COVER_SIZE * 2;
  const scaled = source.resize({ width: pixels, height: pixels, quality: "best" });
  const image = nativeImage.createEmpty();
  image.addRepresentation({
    scaleFactor: 2,
    width: pixels,
    height: pixels,
    buffer: scaled.toPNG(),
  });
  return image;
}

/** 切歌时异步拉取封面；拉取完成且仍是当前歌曲才写入缓存并通知刷新。 */
function syncCover(artworkUrl: string | null, onLoaded: () => void) {
  const url = artworkUrl ? resolveCoverUrl(artworkUrl) : null;
  if (!url) {
    cover = null;
    return;
  }
  if (cover?.url === url) return;
  cover = { url, image: null };
  loadCover(url)
    .then((image) => {
      if (cover?.url !== url) return;
      cover = { url, image };
      onLoaded();
    })
    .catch((error) => trayLog.warn("[mac-tray] failed to load cover", error));
}

// ─── 菜单 ───

/** 菜单栏与 Dock 共用的「正在播放 + 播放控制」段。 */
function buildPlaybackItems(
  options: MacTrayOptions,
  copy: MacTrayCopy,
): MenuItemConstructorOptions[] {
  const snapshot = options.playback.getSnapshot();
  const track = describeTrack(snapshot, copy);
  const canControl = Boolean(snapshot?.canControl && track);
  const coverImage = cover?.image ?? undefined;

  const header: MenuItemConstructorOptions = track
    ? supportsSublabel()
      ? {
          label: truncate(track.title),
          sublabel: truncate(track.artists),
          icon: coverImage,
          click: () => run("show main window", () => options.showMainWindow()),
        }
      : {
          label: truncate(`${track.title} - ${track.artists}`),
          icon: coverImage,
          click: () => run("show main window", () => options.showMainWindow()),
        }
    : { label: copy.nothingPlaying, enabled: false };

  return [
    header,
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
      click: () => run("toggle-like", () => toggleLike(options)),
    },
  ];
}

function buildWallpaperItem(options: MacTrayOptions, copy: MacTrayCopy) {
  const wallpaper = options.getWallpaperService();
  const enabled = wallpaper?.getModel().preferences.enabled ?? false;
  return {
    label: copy.desktopWallpaper,
    type: "checkbox",
    checked: enabled,
    enabled: wallpaper !== null,
    click: () => run("toggle desktop wallpaper", () => wallpaper?.configure({ enabled: !enabled })),
  } satisfies MenuItemConstructorOptions;
}

/** 菜单栏菜单每次点开时现建，开关状态始终与各窗口实际状态一致。 */
function buildStatusMenu(options: MacTrayOptions, rerender: () => void) {
  const copy = getCopy();
  const lyric = getDesktopLyricPreferences();
  const mode = getDisplayMode();

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
    buildWallpaperItem(options, copy),
    {
      label: copy.desktopController,
      type: "checkbox",
      checked: isDesktopPlaybackControllerOpen(),
      click: () => run("toggle desktop controller", toggleDesktopPlaybackController),
    },
    { type: "separator" },
    {
      label: copy.menuBarDisplay,
      submenu: DISPLAY_MODES.map((value) => ({
        label: copy[DISPLAY_MODE_LABEL[value]],
        type: "radio",
        checked: value === mode,
        click: () => {
          if (value === getDisplayMode()) return;
          setDisplayMode(value);
          rerender();
        },
      })),
    },
    {
      label: copy.showMainWindow,
      click: () => run("show main window", () => options.showMainWindow()),
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

/** Dock 菜单是静态快照，状态变化时整体重建；系统会自动追加“显示所有窗口 / 隐藏 / 退出”。 */
function buildDockMenu(options: MacTrayOptions) {
  const copy = getCopy();
  return Menu.buildFromTemplate([
    ...buildPlaybackItems(options, copy),
    { type: "separator" },
    buildWallpaperItem(options, copy),
  ]);
}

// ─── 菜单栏按钮 ───

function destroyStatusItems() {
  if (!items) return;
  for (const tray of Object.values(items) as (Tray | null)[]) {
    if (tray && !tray.isDestroyed()) tray.destroy();
  }
  items = null;
  layoutKey = null;
  statusSignature = null;
}

function createControlItem(icon: NativeImage, onClick: () => void) {
  const tray = new Tray(icon);
  // 连点下一首时每次点击都要生效，不能被合并成双击。
  tray.setIgnoreDoubleClickEvents(true);
  tray.on("click", onClick);
  return tray;
}

function createStatusItems(
  options: MacTrayOptions,
  layout: { controls: boolean; title: boolean },
  popUp: (tray: Tray) => void,
): StatusItems {
  const logo = new Tray(createLogoIcon());
  logo.on("click", () => popUp(logo));
  logo.on("right-click", () => popUp(logo));

  const created: StatusItems = {
    logo,
    like: null,
    next: null,
    toggle: null,
    previous: null,
    title: null,
  };
  if (layout.controls) {
    created.like = createControlItem(getControlIcon("heart"), () =>
      run("toggle-like", () => toggleLike(options)),
    );
    created.next = createControlItem(getControlIcon("next"), () =>
      run("next", options.playback.next),
    );
    created.toggle = createControlItem(getControlIcon("play"), () =>
      run("toggle", options.playback.toggle),
    );
    created.previous = createControlItem(getControlIcon("prev"), () =>
      run("previous", options.playback.previous),
    );
  }
  if (layout.title) {
    const title = new Tray(nativeImage.createEmpty());
    title.on("click", () => popUp(title));
    title.on("right-click", () => popUp(title));
    created.title = title;
  }
  return created;
}

/** 布局（显示哪些按钮）变化时整组重建以保持相邻顺序；其余状态原地更新。 */
function renderStatusItems(
  options: MacTrayOptions,
  snapshot: PlaybackProjection | null,
  popUp: (tray: Tray) => void,
) {
  const copy = getCopy();
  const mode = getDisplayMode();
  const track = describeTrack(snapshot, copy);
  const layout = {
    controls: Boolean(track) && mode !== "icon",
    title: Boolean(track) && (mode === "full" || mode === "compact"),
  };
  const nextLayoutKey = `${layout.controls}|${layout.title}`;
  if (nextLayoutKey !== layoutKey) {
    destroyStatusItems();
    items = createStatusItems(options, layout, popUp);
    layoutKey = nextLayoutKey;
  }
  if (!items) return;

  // 播放进度等高频推送不影响菜单栏，只在展示内容变化时才写入原生对象。
  const signature = JSON.stringify([
    mode,
    track?.title ?? null,
    track?.artists ?? null,
    snapshot?.isPlaying ?? false,
    snapshot?.liked ?? false,
  ]);
  if (signature === statusSignature) return;
  statusSignature = signature;

  items.logo.setToolTip(track ? `${track.title} - ${track.artists}` : "Scopify");
  items.toggle?.setImage(getControlIcon(snapshot?.isPlaying ? "pause" : "play"));
  items.toggle?.setToolTip(snapshot?.isPlaying ? copy.pause : copy.play);
  items.previous?.setToolTip(copy.previous);
  items.next?.setToolTip(copy.next);
  items.like?.setImage(getControlIcon(snapshot?.liked ? "heartFilled" : "heart"));
  items.like?.setToolTip(snapshot?.liked ? copy.unlike : copy.like);
  if (items.title && track) {
    const text =
      mode === "full"
        ? truncate(`${track.title} - ${track.artists}`, MAX_STATUS_TEXT_LENGTH.full)
        : truncate(track.title, MAX_STATUS_TEXT_LENGTH.compact);
    items.title.setTitle(text);
    items.title.setToolTip(`${track.title} - ${track.artists}`);
  }
}

function getDockSignature(options: MacTrayOptions, snapshot: PlaybackProjection | null) {
  const track = snapshot?.track;
  return JSON.stringify([
    track?.id ?? null,
    track?.title ?? null,
    track?.artistNames ?? null,
    snapshot?.isPlaying ?? false,
    snapshot?.liked ?? false,
    snapshot?.canControl ?? false,
    Boolean(cover?.image),
    options.getWallpaperService()?.getModel().preferences.enabled ?? null,
  ]);
}

/**
 * 初始化 macOS 菜单栏（网易云式「歌名 + 播放控制 + 图标」）与 Dock 右键菜单。重复调用保持幂等。
 * 点击图标或歌名弹出原生菜单；展示档位可在菜单的「菜单栏显示」里切换并持久化。
 */
export function initMacTray(options: MacTrayOptions) {
  if (process.platform !== "darwin" || items) return;

  let dockSignature: string | null = null;

  const popUp = (tray: Tray) => {
    if (tray.isDestroyed()) return;
    tray.popUpContextMenu(buildStatusMenu(options, renderAll));
  };

  function refreshDock() {
    const signature = getDockSignature(options, options.playback.getSnapshot());
    if (signature === dockSignature) return;
    dockSignature = signature;
    app.dock?.setMenu(buildDockMenu(options));
  }

  function renderAll() {
    const snapshot = options.playback.getSnapshot();
    syncCover(describeTrack(snapshot, getCopy())?.artworkUrl ?? null, refreshDock);
    renderStatusItems(options, snapshot, popUp);
    refreshDock();
  }

  renderAll();
  cleanups.push(options.playback.subscribe(renderAll));
  const wallpaper = options.getWallpaperService();
  if (wallpaper) cleanups.push(wallpaper.subscribe(refreshDock));

  app.once("before-quit", disposeMacTray);
}

export function disposeMacTray() {
  for (const cleanup of cleanups) cleanup();
  cleanups = [];
  destroyStatusItems();
  cover = null;
}
