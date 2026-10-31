import type { Theme } from "@scopify/ui/folia";

import audioEqualizerScreenshot from "@/assets/features/audio-equalizer.png";
import audioQualityScreenshot from "@/assets/features/audio-quality.png";
import commentScreenshot from "@/assets/features/comment.png";
import desktopMusicScreenshot from "@/assets/features/desktopMusic.png";
import discoveryScreenshot from "@/assets/features/discovery-home.png";
import dynamicIslandScreenshot from "@/assets/features/dynamic-island.png";
import libraryScreenshot from "@/assets/features/library-liked.png";
import lyricDynamicScreenshot from "@/assets/features/lyricDynamic.png";
import lyricPanelScreenshot from "@/assets/features/lyricPanelController.png";
import lyricStyleEditorScreenshot from "@/assets/features/lyricStyleEditor.png";
import lyricsControllerScreenshot from "@/assets/features/lyrics-controller.png";
import foliaStageScreenshot from "@/assets/features/lyrics-folia-stage.png";
import mainScreenshot from "@/assets/features/main.png";
import mcpScreenshot from "@/assets/features/MCP.png";
import playlistScreenshot from "@/assets/features/Playlist.png";
import personalFmScreenshot from "@/assets/features/personal-fm.png";
import profileScreenshot from "@/assets/features/profile.png";
import searchModalScreenshot from "@/assets/features/SearchModal.png";
import searchResultScreenshot from "@/assets/features/SearchResult.png";
import settingsGeneralScreenshot from "@/assets/features/settings-general.png";
import settingsShortcutsScreenshot from "@/assets/features/settings-shortcuts.png";
import visualThemeEditorScreenshot from "@/assets/features/visualThemEditor.png";
import type {
  LandingCredit,
  LandingChapter,
  LandingCoverCrop,
  LandingDayMoment,
  LandingEqPreset,
  LandingPalette,
  LandingQualityTier,
  LandingScreenshot,
  LandingThemePreset,
  LandingVisualizerMode,
} from "@/types/marketing";

export const LANDING_WEB_APP_URL = "https://scopify-web.vercel.app";
export const LANDING_GITHUB_URL = "https://github.com/MT-SUPER-POWER/Scopify";
export const LANDING_RELEASES_URL = `${LANDING_GITHUB_URL}/releases`;

/**
 * 落地页里「钉住一屏」的章节在什么尺寸下吸顶：宽度放得下两栏、高度放得下整屏内容。
 * 与 app/globals.css 里的 `landing-pin` 变体保持一致。
 */
export const LANDING_PIN_MEDIA_QUERY = "(min-width: 64rem) and (min-height: 48rem)";

export const LANDING_FOLIA_THEME: Theme = {
  accentColor: "#b8c7ef",
  animationIntensity: "normal",
  backgroundColor: "#070912",
  fontStyle: "serif",
  fontWeight: 500,
  name: "Scopify Nocturne",
  primaryColor: "#d9deea",
  secondaryColor: "#7186b3",
  wordColors: [
    { word: "声音", color: "#f4f6ff" },
    { word: "歌词", color: "#aebfe9" },
    { word: "Scopify", color: "#d9deea" },
  ],
};

export const LANDING_FOLIA_STAGE_SCREENSHOT: LandingScreenshot = {
  alt: "Scopify Folia 动态歌词舞台",
  src: foliaStageScreenshot,
};

/** 与 Folia 歌词动画选择器保持一致的模式与中文名。 */
export const LANDING_VISUALIZER_MODES: readonly LandingVisualizerMode[] = [
  // 由静到闹排：先是安静的排版类动画，越往下滚舞台越满，最绚烂的几场压轴。
  { label: "静止", value: "still" },
  { label: "流光", value: "classic" },
  { label: "云阶", value: "partita" },
  { label: "倾诉", value: "tilt" },
  { label: "心象", value: "cadenza" },
  { label: "浮名", value: "fume" },
  { label: "回环", value: "claddagh" },
  { label: "档案", value: "archive" },
  { label: "群唱", value: "cappella" },
  { label: "时计", value: "pendolo" },
  { label: "莫奈", value: "monet" },
  { label: "雾笺", value: "nebbia" },
  { label: "镜台", value: "diorama" },
  { label: "町景", value: "machi" },
  { label: "商籁", value: "sonnet" },
  { label: "凝彩", value: "tempera" },
  { label: "花火", value: "hanabi" },
];

export const LANDING_DEFAULT_VISUALIZER = "sonnet";

/** 与播放栏音质选择器一致，从低到高排列。 */
export const LANDING_QUALITY_TIERS: readonly LandingQualityTier[] = [
  { label: "标准", spec: "128kbps" },
  { label: "极高", spec: "320kbps" },
  { label: "无损", spec: "48kHz / 16bit" },
  { label: "Hi-Res", spec: "192kHz / 24bit" },
  { label: "高清臻音", spec: "Spatial Audio" },
  { label: "杜比全景声", spec: "Dolby Atmos" },
  { label: "臻音全景声", spec: "Audio Vivid" },
  { label: "沉浸环绕声", spec: "5.1 Surround" },
  { label: "超清母带", spec: "192kHz / 24bit Master" },
];

/** 与客户端十段均衡器相同的中心频率。 */
export const LANDING_EQ_BANDS = [
  "31",
  "62",
  "125",
  "250",
  "500",
  "1k",
  "2k",
  "4k",
  "8k",
  "16k",
] as const;

export const LANDING_EQ_MAX_GAIN = 12;

export const LANDING_EQ_PRESETS: readonly LandingEqPreset[] = [
  { id: "flat", name: "水平", gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "v", name: "V 形", gains: [7, 5.5, 3, 0.5, -2.5, -3, -1, 2.5, 5, 7] },
  { id: "bass", name: "低音", gains: [9, 8, 6, 3, 0.5, -1, -1, 0, 0.5, 1] },
  { id: "vocal", name: "人声", gains: [-3, -2, -1, 2, 5, 6, 4.5, 2, 0, -1.5] },
  { id: "bright", name: "明亮", gains: [-1.5, -1, 0, 0, 1, 2.5, 4, 6, 7.5, 8] },
];

export const LANDING_EQ_DEFAULT_PRESET = "v";

/** 音色效果面板中的其余处理，客户端里都能拖动即时生效。 */
export const LANDING_SOUND_EFFECTS = [
  "低切 / 高切",
  "驱动",
  "颗粒",
  "磁带抖晃",
  "黑胶噪声",
  "立体声宽度",
  "空间混响",
  "低频冲击",
] as const;

export const LANDING_DAY_MOMENTS: readonly LandingDayMoment[] = [
  {
    scene: "开场",
    feature: "每日推荐",
    sentence: "清晨，每日推荐已经替你挑好了今天的第一首。",
    screenshot: { alt: "Scopify 首页每日推荐", src: discoveryScreenshot },
  },
  {
    scene: "找歌",
    feature: "快捷搜索",
    sentence: "上午手头正忙，忽然想起一首歌：搜索框就在眼前，不必离开正在看的页面。",
    screenshot: { alt: "Scopify 快捷搜索弹窗", src: searchModalScreenshot },
  },
  {
    scene: "随听",
    feature: "私人 FM",
    sentence: "不想选歌时，把下一首交给私人 FM。先听听推荐，也可以随时回到熟悉的播放队列。",
    screenshot: { alt: "Scopify 私人 FM 推荐歌单", src: personalFmScreenshot },
  },
  {
    scene: "闲翻",
    feature: "评论",
    sentence: "午休的片刻，翻翻评论区，看看别人在这首歌里留下了什么。",
    screenshot: { alt: "Scopify 歌曲评论", src: commentScreenshot },
  },
  {
    scene: "专注",
    feature: "桌面歌词",
    sentence: "午后开着文档写东西，让歌词浮在角落；译文、置顶与鼠标穿透，都能按自己的习惯调整。",
    screenshot: { alt: "Scopify 桌面歌词与音乐控制面板", src: desktopMusicScreenshot },
  },
  {
    scene: "抬眼",
    feature: "灵动岛 · 任务栏歌词",
    sentence: "歌词也可以待在屏幕顶边或任务栏里。灵动岛的大小、换行动画和非遮挡模式，由你决定。",
    screenshot: { alt: "Scopify 灵动岛与任务栏歌词设置", src: dynamicIslandScreenshot },
  },
  {
    scene: "沉浸",
    feature: "Folia 全屏歌词",
    sentence: "夜晚是 Folia 的主场：全屏、关灯，让每一句歌词换一种样子出场。",
    screenshot: { alt: "Scopify Folia 动态歌词", src: lyricDynamicScreenshot },
  },
  {
    scene: "夜听",
    feature: "ReplayGain",
    sentence: "深夜把音量调低一点，ReplayGain 帮你把每首歌的响度放平，不会被下一首吓到。",
    screenshot: { alt: "Scopify 歌词面板中的 ReplayGain 音频增益设置", src: lyricPanelScreenshot },
  },
  {
    scene: "对话",
    feature: "MCP · AI 助手",
    sentence: "把音乐接入你常用的 AI 助手。通过本地 MCP 连接控制播放，并单独配置可用的工具权限。",
    screenshot: { alt: "Scopify 本地 MCP 连接与工具权限入口", src: mcpScreenshot },
  },
];

/** 与客户端 `BACKGROUND_PRESETS` 及其中文名保持一致。 */
export const LANDING_THEME_PRESETS: readonly LandingThemePreset[] = [
  { id: "silver", name: "雾银", top: "#92999D", bottom: "#454B50" },
  { id: "mist", name: "晨雾", top: "#A3C9E6", bottom: "#485D70" },
  { id: "sage", name: "浅苔", top: "#BCCCB0", bottom: "#526A59" },
  { id: "sand", name: "暖砂", top: "#E0CCAC", bottom: "#78685C" },
  { id: "lavender", name: "淡紫", top: "#CDB8E4", bottom: "#625976" },
];

export const LANDING_THEME_DEFAULT_INTENSITY = 70;

/** 整页当作一首歌的总时长（秒），与首屏截图里正在播放的《Touch》一致。 */
export const LANDING_SONG_DURATION = 205;

/** 声场的底色，同时也是落地页的页面底色。 */
export const LANDING_BASE_COLOR = "#05060b";

const palette = (deep: string, mid: string, glow: string): LandingPalette => [
  LANDING_BASE_COLOR,
  deep,
  mid,
  glow,
];

export const LANDING_CHAPTERS: readonly LandingChapter[] = [
  {
    id: "intro",
    movement: "Intro",
    title: "前奏 · 原样都在",
    intensity: 1,
    palette: palette("#0c1733", "#1c3f72", "#63e3a6"),
  },
  {
    id: "verse",
    movement: "Verse",
    title: "主歌 · 歌词舞台",
    intensity: 0.8,
    palette: palette("#10162a", "#38487a", "#b8c7ef"),
  },
  {
    id: "chorus",
    movement: "Chorus",
    title: "副歌 · 声音",
    intensity: 0.55,
    palette: palette("#04180f", "#0d4c33", "#1ed760"),
  },
  {
    id: "bridge",
    movement: "Bridge",
    title: "桥段 · 听歌的日常",
    intensity: 0.5,
    palette: palette("#1a110b", "#5a3a22", "#f0b878"),
  },
  {
    id: "variation",
    movement: "Variation",
    title: "变奏 · 你的颜色",
    intensity: 0.8,
    palette: palette("#16121f", "#4a3f63", "#cdb8e4"),
  },
  {
    id: "echo",
    movement: "Echo",
    title: "回声 · 底片",
    intensity: 0.5,
    palette: palette("#110d1e", "#352858", "#a48cff"),
  },
  {
    id: "outro",
    movement: "Outro",
    title: "尾声 · 每一句",
    intensity: 1,
    palette: palette("#0c1733", "#1c3f72", "#63e3a6"),
  },
];

export const LANDING_MAIN_SCREENSHOT: LandingScreenshot = {
  alt: "Scopify 首页：每日推荐、为你推荐与底部播放栏",
  src: mainScreenshot,
};

/** `main.png`（1600×900）「为你推荐」一行里的六张真实专辑封面。 */
export const LANDING_COVER_CROPS: readonly LandingCoverCrop[] = [
  330, 532, 733, 935, 1137, 1338,
].map((x) => ({ x, y: 358, size: 178 }));

/** 底片墙与首屏海报墙共用的真实界面截图。 */
export const LANDING_FILM_SCREENSHOTS: readonly LandingScreenshot[] = [
  { alt: "Scopify 主界面", src: mainScreenshot },
  LANDING_FOLIA_STAGE_SCREENSHOT,
  { alt: "Scopify 歌单详情", src: playlistScreenshot },
  { alt: "Scopify 动态歌词", src: lyricDynamicScreenshot },
  { alt: "Scopify 首页推荐", src: discoveryScreenshot },
  { alt: "Scopify 视觉主题编辑器", src: visualThemeEditorScreenshot },
  { alt: "Scopify 搜索结果", src: searchResultScreenshot },
  { alt: "Scopify 桌面歌词与音乐控制", src: desktopMusicScreenshot },
  { alt: "Scopify 私人 FM", src: personalFmScreenshot },
  { alt: "Scopify 灵动岛与任务栏歌词设置", src: dynamicIslandScreenshot },
  { alt: "Scopify 喜欢的音乐", src: libraryScreenshot },
  { alt: "Scopify 歌词样式编辑器", src: lyricStyleEditorScreenshot },
  { alt: "Scopify 十段均衡器", src: audioEqualizerScreenshot },
  { alt: "Scopify 歌曲评论", src: commentScreenshot },
  { alt: "Scopify 歌词控制面板", src: lyricsControllerScreenshot },
  { alt: "Scopify 用户资料", src: profileScreenshot },
  { alt: "Scopify 歌词面板控制器", src: lyricPanelScreenshot },
  { alt: "Scopify 音质选择", src: audioQualityScreenshot },
  { alt: "Scopify 通用设置", src: settingsGeneralScreenshot },
  { alt: "Scopify 快捷键设置", src: settingsShortcutsScreenshot },
  { alt: "Scopify 通过 MCP 接入 AI 助手", src: mcpScreenshot },
  { alt: "Scopify 快捷搜索", src: searchModalScreenshot },
];

/** 尾声开头的片尾字幕：像电影散场一样把这首「歌」的演职员表滚过去，最后道一声谢。 */
export const LANDING_CREDITS: readonly LandingCredit[] = [
  { role: "主演", name: "你，和你听过的每一首歌" },
  { role: "歌词动画", name: `Folia · ${LANDING_VISUALIZER_MODES.length} 种` },
  { role: "音源", name: "网易云音乐" },
  { role: "音质", name: `${LANDING_QUALITY_TIERS.length} 档，一路到超清母带` },
  { role: "均衡", name: `${LANDING_EQ_BANDS.length} 段均衡器` },
  { role: "桌面端", name: "Electron" },
  { role: "界面", name: "Next.js · React" },
  { role: "截图", name: "全部截自正在运行的客户端" },
  { role: "开源协议", name: "AGPL-3.0" },
];

/** 片尾字幕滚完后的最后一行。 */
export const LANDING_CREDITS_THANKS = "感谢收听";
