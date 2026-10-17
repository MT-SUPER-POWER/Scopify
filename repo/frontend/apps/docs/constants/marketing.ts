import type { Theme } from "@scopify/ui/folia";

import audioEqualizerScreenshot from "@/assets/features/audio-equalizer.png";
import audioQualityScreenshot from "@/assets/features/audio-quality.png";
import commentScreenshot from "@/assets/features/comment.png";
import desktopMusicScreenshot from "@/assets/features/desktopMusic.png";
import discoveryScreenshot from "@/assets/features/discovery-home.png";
import libraryScreenshot from "@/assets/features/library-liked.png";
import lyricDynamicScreenshot from "@/assets/features/lyricDynamic.png";
import lyricPanelScreenshot from "@/assets/features/lyricPanelController.png";
import lyricStyleEditorScreenshot from "@/assets/features/lyricStyleEditor.png";
import lyricsControllerScreenshot from "@/assets/features/lyrics-controller.png";
import foliaStageScreenshot from "@/assets/features/lyrics-folia-stage.png";
import mainScreenshot from "@/assets/features/main.png";
import mcpScreenshot from "@/assets/features/MCP.png";
import playlistScreenshot from "@/assets/features/Playlist.png";
import profileScreenshot from "@/assets/features/profile.png";
import searchModalScreenshot from "@/assets/features/SearchModal.png";
import searchResultScreenshot from "@/assets/features/SearchResult.png";
import settingsGeneralScreenshot from "@/assets/features/settings-general.png";
import settingsShortcutsScreenshot from "@/assets/features/settings-shortcuts.png";
import visualThemeEditorScreenshot from "@/assets/features/visualThemEditor.png";
import type {
  FoliaLatentTuning,
  LandingDayMoment,
  LandingFavoriteFeature,
  LandingScreenshot,
  LandingThemePreset,
  LandingVisualizerMode,
} from "@/types/marketing";

export const LANDING_WEB_APP_URL = "https://scopify-web.vercel.app";
export const LANDING_GITHUB_URL = "https://github.com/MT-SUPER-POWER/Scopify";
export const LANDING_RELEASES_URL = `${LANDING_GITHUB_URL}/releases`;
export const LANDING_FEATURES_DOC_URL = "/docs/features";

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

export const LANDING_SONNET_LOOP_DURATION = 16;

export const LANDING_SONNET_COPY = [
  { text: "声音经过这里。", start: 0, end: 3.2 },
  { text: "字开始移动。", start: 3.2, end: 6.4 },
  { text: "停顿。", start: 6.4, end: 9.2 },
  { text: "转弯。", start: 9.2, end: 12 },
  { text: "下一句出现。", start: 12, end: 16 },
] as const;

export const LANDING_LATENT_TUNING: FoliaLatentTuning = {
  displayMode: "both",
  colorSource: "cover-theme",
  dynamicOnlyInPlayer: true,
  enhancedBeatResponse: true,
  ditheringSpeed: 0.1,
  ditheringAudioSpeed: 1.2,
  ditheringSize: 2.5,
  ditheringOpacity: 0.55,
  meshSpeed: 0.3,
  meshAudioSpeed: 2,
  meshDistortion: 0.8,
  meshSwirl: 0.1,
  overlayEnabled: true,
  overlayOpacity: 0.35,
};

export const LANDING_FOLIA_STAGE_SCREENSHOT: LandingScreenshot = {
  alt: "Scopify Folia 动态歌词舞台",
  src: foliaStageScreenshot,
};

/** 与 Folia 歌词动画选择器保持一致的模式与中文名。 */
export const LANDING_VISUALIZER_MODES: readonly LandingVisualizerMode[] = [
  { label: "流光", value: "classic" },
  { label: "心象", value: "cadenza" },
  { label: "云阶", value: "partita" },
  { label: "浮名", value: "fume" },
  { label: "倾诉", value: "tilt" },
  { label: "回环", value: "claddagh" },
  { label: "莫奈", value: "monet" },
  { label: "时计", value: "pendolo" },
  { label: "群唱", value: "cappella" },
  { label: "镜台", value: "diorama" },
  { label: "商籁", value: "sonnet" },
  { label: "静止", value: "still" },
  { label: "档案", value: "archive" },
  { label: "凝彩", value: "tempera" },
];

export const LANDING_DEFAULT_VISUALIZER = "sonnet";

/** 播放栏音质选择器中的档位数量（标准 → 超清母带）。 */
export const LANDING_AUDIO_QUALITY_COUNT = 9;

export const LANDING_FAVORITE_FEATURES: readonly LandingFavoriteFeature[] = [
  {
    title: "首页与每日推荐",
    detail: "推荐歌单、播客声音与歌手，沿着一条路一直往下听。",
    meta: "每日更新",
    href: `${LANDING_FEATURES_DOC_URL}#首页与推荐`,
    screenshot: { alt: "Scopify 首页推荐", src: discoveryScreenshot },
  },
  {
    title: "快捷搜索",
    detail: "不离开当前页面，结果按歌曲、歌单、专辑与用户分好类。",
    meta: "3 种入口",
    href: `${LANDING_FEATURES_DOC_URL}#搜索入口`,
    screenshot: { alt: "Scopify 快捷搜索", src: searchModalScreenshot },
  },
  {
    title: "音质与均衡器",
    detail: "从标准到超清母带；10 段均衡、混响、磁带抖晃与黑胶噪声。",
    meta: "10 段 EQ",
    href: `${LANDING_FEATURES_DOC_URL}#均衡器与响度`,
    screenshot: { alt: "Scopify 十段均衡器", src: audioEqualizerScreenshot },
  },
  {
    title: "桌面歌词",
    detail: "独立于主窗口浮在桌面上，可以置顶，也可以让鼠标直接穿过。",
    meta: "桌面端",
    href: `${LANDING_FEATURES_DOC_URL}#桌面歌词`,
    screenshot: { alt: "Scopify 桌面歌词", src: desktopMusicScreenshot },
  },
  {
    title: "我喜欢的音乐",
    detail: "喜欢、收藏、自建歌单与最近播放都在音乐库，列表内也能搜。",
    meta: "音乐库",
    href: `${LANDING_FEATURES_DOC_URL}#个人音乐库`,
    screenshot: { alt: "Scopify 喜欢的音乐列表", src: libraryScreenshot },
  },
];

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
    scene: "闲翻",
    feature: "评论",
    sentence: "午休的片刻，翻翻评论区，看看别人在这首歌里留下了什么。",
    screenshot: { alt: "Scopify 歌曲评论", src: commentScreenshot },
  },
  {
    scene: "专注",
    feature: "桌面歌词",
    sentence: "午后开着文档写东西，桌面歌词安静地浮在角落，鼠标可以直接穿过它。",
    screenshot: { alt: "Scopify 桌面歌词", src: desktopMusicScreenshot },
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
    screenshot: { alt: "Scopify 音质与响度设置", src: audioQualityScreenshot },
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

/** 底片墙与首屏海报墙共用的真实界面截图。 */
export const LANDING_FILM_SCREENSHOTS: readonly LandingScreenshot[] = [
  { alt: "Scopify 主界面", src: mainScreenshot },
  LANDING_FOLIA_STAGE_SCREENSHOT,
  { alt: "Scopify 歌单详情", src: playlistScreenshot },
  { alt: "Scopify 动态歌词", src: lyricDynamicScreenshot },
  { alt: "Scopify 首页推荐", src: discoveryScreenshot },
  { alt: "Scopify 视觉主题编辑器", src: visualThemeEditorScreenshot },
  { alt: "Scopify 搜索结果", src: searchResultScreenshot },
  { alt: "Scopify 桌面歌词", src: desktopMusicScreenshot },
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
