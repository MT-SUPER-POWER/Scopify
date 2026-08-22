import type { Theme } from "@scopify/ui/folia";

import type { LandingCinematicChapter } from "@/types/marketing";
import type { FoliaLatentTuning } from "@/types/marketing";

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

export const LANDING_CINEMATIC_DURATION = 30;
export const LANDING_SONNET_LOOP_DURATION = 10;

export const LANDING_CINEMATIC_COPY = [
  { text: "让声音，显形。", start: 0, end: 3.3 },
  { text: "从一首歌开始。", start: 3.3, end: 6.5 },
  { text: "逐字歌词跟着演唱向前。", start: 6.5, end: 10 },
  { text: "排版、颜色与镜头一起变化。", start: 10, end: 13.5 },
  { text: "滚动，就是这段画面的时间轴。", start: 13.5, end: 17 },
  { text: "向前推进，也可以倒回上一拍。", start: 17, end: 20.5 },
  { text: "从播放器，走到你的桌面。", start: 20.5, end: 23.8 },
  { text: "窗口关上，播放仍在继续。", start: 23.8, end: 26.8 },
  { text: "今晚，从 Scopify 开始。", start: 26.8, end: 30 },
] as const;

export const LANDING_CINEMATIC_CHAPTERS: LandingCinematicChapter[] = [
  {
    eyebrow: "ACT I · SONNET",
    title: "让声音，显形。",
    description: "商籁把标题、歌词与图形剪进同一段节奏。",
    mode: "sonnet",
    start: 0,
    end: 0.34,
  },
  {
    eyebrow: "ACT II · DIORAMA",
    title: "镜头穿过每一句。",
    description: "镜台把歌词放进真实的三维路径，滚动控制摄影机向前或倒退。",
    mode: "diorama",
    start: 0.34,
    end: 0.68,
  },
  {
    eyebrow: "ACT III · PARTITA",
    title: "音乐，留在桌面。",
    description: "云阶让节奏慢下来，真实界面从歌词舞台里显现。",
    mode: "partita",
    start: 0.68,
    end: 1,
  },
];

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
