import type { Theme } from "@scopify/ui/folia";

import type { FoliaLatentTuning } from "@/types/marketing";

export const LANDING_GITHUB_URL = "https://github.com/MT-SUPER-POWER/Scopify";

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
export const LANDING_PARTITA_ANIMATION_DURATION = 3.8;
export const LANDING_PARTITA_SLOGAN = "让声音，显形。";

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
