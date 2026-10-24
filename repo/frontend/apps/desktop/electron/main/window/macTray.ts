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
  type Point,
  type Rectangle,
} from "electron";
import type { PlaybackProjection } from "@scopify/desktop-contract";
import type { MacMenuBarPreferences, MacTrayLocale, MacTrayOptions } from "@/types/tray";
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
/** 菜单栏文字占的是所有应用共享的空间，歌词过长时省略。 */
const MAX_LYRIC_TEXT_LENGTH = 30;
/** 歌词切行定时器的最短间隔，避免密集短句时空转。 */
const MIN_LYRIC_TICK_MS = 50;
/** 菜单头部封面 32pt，按 @2x 取 64px。 */
const COVER_SIZE = 32;
/** 控制按钮单个 16pt，按钮之间 10pt，比系统给独立菜单栏项留的间距更紧凑。 */
const CONTROL_ICON_SIZE = 16;
const CONTROL_GAP = 10;
const PREFERENCES_FILE = "mac-menu-bar.json";
const DEFAULT_PREFERENCES: MacMenuBarPreferences = { showLyrics: true, showControls: true };

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
    menuBarLyrics: "歌词",
    menuBarControls: "播放控制",
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
    menuBarLyrics: "歌詞",
    menuBarControls: "播放控制",
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
    menuBarLyrics: "Lyrics",
    menuBarControls: "Playback Controls",
    showMainWindow: "Show Main Window",
    settings: "Settings…",
    quit: "Quit Scopify",
  },
} satisfies Record<MacTrayLocale, Record<string, string>>;

type MacTrayCopy = (typeof COPY)[MacTrayLocale];

/**
 * 菜单栏由三个 NSStatusItem 组成。系统把后创建的放在左侧，所以按 logo → 控制 → 歌名
 * 的顺序创建，得到与网易云一致的「歌名 ⏮ ⏯ ⏭ ♡ logo」排列。
 * 四个控制按钮画在同一张图里、按点击位置分发：独立 StatusItem 之间的系统间距过宽且不可调。
 */
interface StatusItems {
  logo: Tray;
  controls: Tray | null;
  title: Tray | null;
}

type ControlIconName = "heart" | "heartFilled" | "next" | "pause" | "play" | "prev";
type ControlAction = "previous" | "toggle" | "next" | "like";

const CONTROL_ACTIONS: ControlAction[] = ["previous", "toggle", "next", "like"];

interface LyricLine {
  startTimeMs: number;
  text: string;
}

interface LyricCache {
  key: string;
  lines: LyricLine[];
}

interface CoverCache {
  url: string;
  image: NativeImage | null;
}

// Electron 原生对象必须保留强引用，否则垃圾回收会让菜单栏图标提前消失。
let items: StatusItems | null = null;
let layoutKey: string | null = null;
let statusSignature: string | null = null;
let menuBarPreferences: MacMenuBarPreferences | null = null;
let cover: CoverCache | null = null;
let lyricCache: LyricCache | null = null;
let lyricTimer: ReturnType<typeof setTimeout> | undefined;
let lyricText: string | null = null;
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

function getMenuBarPreferences(): MacMenuBarPreferences {
  if (menuBarPreferences) return menuBarPreferences;
  const parsed = readUserDataJson(PREFERENCES_FILE, trayLog);
  const read = (key: keyof MacMenuBarPreferences) =>
    isRecord(parsed) && typeof parsed[key] === "boolean"
      ? (parsed[key] as boolean)
      : DEFAULT_PREFERENCES[key];
  menuBarPreferences = { showLyrics: read("showLyrics"), showControls: read("showControls") };
  return menuBarPreferences;
}

function updateMenuBarPreferences(update: Partial<MacMenuBarPreferences>) {
  menuBarPreferences = { ...getMenuBarPreferences(), ...update };
  writeUserDataJson(PREFERENCES_FILE, menuBarPreferences, trayLog);
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
function getControlIcon(name: ControlIconName) {
  let icon = controlIcons.get(name);
  if (!icon) {
    icon = nativeImage.createFromPath(join(__menuBarIconDir, `${name}Template.png`));
    icon.setTemplateImage(true);
    if (icon.isEmpty()) trayLog.error("[mac-tray] failed to load control icon", name);
    controlIcons.set(name, icon);
  }
  return icon;
}

const controlStrips = new Map<string, NativeImage>();

/** 把四个 @2x 控制图标横向拼成一张模板图，间距由 CONTROL_GAP 决定。 */
function getControlStrip(isPlaying: boolean, liked: boolean) {
  const key = `${isPlaying}|${liked}`;
  const cached = controlStrips.get(key);
  if (cached) return cached;

  const names: ControlIconName[] = [
    "prev",
    isPlaying ? "pause" : "play",
    "next",
    liked ? "heartFilled" : "heart",
  ];
  const icon = CONTROL_ICON_SIZE * 2;
  const gap = CONTROL_GAP * 2;
  const width = icon * names.length + gap * (names.length - 1);
  const strip = Buffer.alloc(width * icon * 4);
  names.forEach((name, index) => {
    // 直接取 @2x 表示（32px）；resize 按 DIP 计算，会把 @2x 放大成 64px。
    const source = getControlIcon(name).toBitmap({ scaleFactor: 2 });
    if (source.length !== icon * icon * 4) {
      trayLog.error("[mac-tray] unexpected control icon size", name, source.length);
      return;
    }
    const left = index * (icon + gap);
    for (let row = 0; row < icon; row += 1) {
      source.copy(strip, (row * width + left) * 4, row * icon * 4, (row + 1) * icon * 4);
    }
  });

  const image = nativeImage.createFromBitmap(strip, { width, height: icon, scaleFactor: 2 });
  image.setTemplateImage(true);
  controlStrips.set(key, image);
  return image;
}

/** 以图片在菜单栏项中居中为前提，把点击横坐标换算成第几个按钮；落在间隙里归给最近的按钮。 */
function resolveControlAction(bounds: Rectangle, position: Point): ControlAction {
  const slot = CONTROL_ICON_SIZE + CONTROL_GAP;
  const stripWidth = slot * CONTROL_ACTIONS.length - CONTROL_GAP;
  const left = bounds.x + (bounds.width - stripWidth) / 2;
  const index = Math.floor((position.x - left + CONTROL_GAP / 2) / slot);
  return CONTROL_ACTIONS[Math.min(CONTROL_ACTIONS.length - 1, Math.max(0, index))];
}

function runControlAction(options: MacTrayOptions, action: ControlAction) {
  switch (action) {
    case "previous":
      return run("previous", options.playback.previous);
    case "toggle":
      return run("toggle", options.playback.toggle);
    case "next":
      return run("next", options.playback.next);
    case "like":
      return run("toggle-like", () => toggleLike(options));
  }
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
  const display = getMenuBarPreferences();

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
      submenu: [
        {
          label: copy.menuBarLyrics,
          type: "checkbox",
          checked: display.showLyrics,
          click: () => {
            updateMenuBarPreferences({ showLyrics: !display.showLyrics });
            rerender();
          },
        },
        {
          label: copy.menuBarControls,
          type: "checkbox",
          checked: display.showControls,
          click: () => {
            updateMenuBarPreferences({ showControls: !display.showControls });
            rerender();
          },
        },
      ],
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

// ─── 菜单栏歌词 ───

/** 歌词在主进程里是不透明载荷，只按 LyricData 的最小形状读取逐行起始时间与文本。 */
function readLyricLines(snapshot: PlaybackProjection | null): LyricLine[] {
  const lyrics = snapshot?.lyrics;
  const key = `${snapshot?.track?.id ?? ""}|${snapshot?.lyricsVersion ?? ""}`;
  if (lyricCache?.key === key) return lyricCache.lines;

  const lines: LyricLine[] = [];
  if (isRecord(lyrics) && lyrics.isPureMusic !== true && Array.isArray(lyrics.lines)) {
    for (const line of lyrics.lines as unknown[]) {
      if (!isRecord(line) || typeof line.text !== "string") continue;
      if (typeof line.startTimeMs !== "number" || !Number.isFinite(line.startTimeMs)) continue;
      lines.push({ startTimeMs: line.startTimeMs, text: line.text.trim() });
    }
    lines.sort((a, b) => a.startTimeMs - b.startTimeMs);
  }
  lyricCache = { key, lines };
  return lines;
}

/** 按时钟锚点外推当前进度；暂停时锚点不再走动。 */
function getPositionMs(options: MacTrayOptions, snapshot: PlaybackProjection) {
  const anchor = options.getPlaybackAnchor();
  if (!anchor) return snapshot.positionMs;
  if (!snapshot.isPlaying) return anchor.positionMs;
  const elapsed = Math.max(0, Date.now() - anchor.sampledAtMs);
  return anchor.positionMs + elapsed * (anchor.rate || 1);
}

function stopLyricTicker() {
  clearTimeout(lyricTimer);
  lyricTimer = undefined;
  lyricText = null;
}

/**
 * 开启菜单栏歌词时把文字项写成当前歌词，并定时到下一行起点再刷新。
 * 前奏、间奏的空行与无歌词时回退为「歌名 - 歌手」。
 */
function updateLyricTitle(options: MacTrayOptions) {
  clearTimeout(lyricTimer);
  lyricTimer = undefined;
  const title = items?.title;
  const snapshot = options.playback.getSnapshot();
  const track = describeTrack(snapshot, getCopy());
  if (!getMenuBarPreferences().showLyrics || !title || title.isDestroyed() || !snapshot || !track) {
    lyricText = null;
    return;
  }

  const lines = readLyricLines(snapshot);
  const positionMs = getPositionMs(options, snapshot);
  let index = -1;
  for (let i = 0; i < lines.length && lines[i].startTimeMs <= positionMs; i += 1) index = i;

  const text = truncate(
    lines[index]?.text || `${track.title} - ${track.artists}`,
    MAX_LYRIC_TEXT_LENGTH,
  );
  if (text !== lyricText) {
    lyricText = text;
    title.setTitle(text);
  }

  const nextLine = lines[index + 1];
  if (!snapshot.isPlaying || !nextLine) return;
  const rate = options.getPlaybackAnchor()?.rate || 1;
  const delay = Math.max(MIN_LYRIC_TICK_MS, (nextLine.startTimeMs - positionMs) / rate);
  lyricTimer = setTimeout(() => updateLyricTitle(options), delay);
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
  stopLyricTicker();
}

function createStatusItems(
  options: MacTrayOptions,
  layout: { controls: boolean; title: boolean },
  popUp: (tray: Tray) => void,
): StatusItems {
  const logo = new Tray(createLogoIcon());
  logo.on("click", () => popUp(logo));
  logo.on("right-click", () => popUp(logo));

  const created: StatusItems = { logo, controls: null, title: null };
  if (layout.controls) {
    const controls = new Tray(getControlStrip(false, false));
    // 连点下一首时每次点击都要生效，不能被合并成双击。
    controls.setIgnoreDoubleClickEvents(true);
    controls.on("click", (_event, bounds, position) =>
      runControlAction(options, resolveControlAction(bounds, position)),
    );
    created.controls = controls;
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
  const display = getMenuBarPreferences();
  const track = describeTrack(snapshot, copy);
  const layout = {
    controls: Boolean(track) && display.showControls,
    title: Boolean(track) && display.showLyrics,
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
    track?.title ?? null,
    track?.artists ?? null,
    snapshot?.isPlaying ?? false,
    snapshot?.liked ?? false,
  ]);
  if (signature === statusSignature) return;
  statusSignature = signature;

  items.logo.setToolTip(track ? `${track.title} - ${track.artists}` : "Scopify");
  items.controls?.setImage(getControlStrip(Boolean(snapshot?.isPlaying), Boolean(snapshot?.liked)));
  // 歌词文字由 updateLyricTitle 按进度写入，这里只更新悬停提示。
  if (items.title && track) items.title.setToolTip(`${track.title} - ${track.artists}`);
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
 * 初始化 macOS 菜单栏（网易云式「歌词 + 播放控制 + 图标」）与 Dock 右键菜单。重复调用保持幂等。
 * 点击图标或歌词弹出原生菜单；歌词与播放控制可在「菜单栏显示」里分别开关并持久化。
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
    // 播放、暂停、拖动进度都会推送新状态，借此重新对齐歌词定时器。
    updateLyricTitle(options);
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
  lyricCache = null;
}
