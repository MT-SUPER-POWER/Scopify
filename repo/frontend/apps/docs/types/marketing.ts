import type { MotionValue } from "framer-motion";
import type { StaticImageData } from "next/image";

import type { AudioBands, Line } from "@folia/types";

export interface FoliaFluidTheme {
  accentColor: string;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
}

export type FoliaLatentDisplayMode = "dithering" | "mesh" | "both";
export type FoliaLatentColorSource = "cover-theme" | "cover-only";

export interface FoliaLatentTuning {
  colorSource: FoliaLatentColorSource;
  displayMode: FoliaLatentDisplayMode;
  ditheringAudioSpeed: number;
  ditheringOpacity: number;
  ditheringSize: number;
  ditheringSpeed: number;
  dynamicOnlyInPlayer: boolean;
  enhancedBeatResponse: boolean;
  meshAudioSpeed: number;
  meshDistortion: number;
  meshSpeed: number;
  meshSwirl: number;
  overlayEnabled: boolean;
  overlayOpacity: number;
}

export interface LandingFoliaTimeline {
  audioBands: AudioBands;
  audioPower: MotionValue<number>;
  currentLineIndex: number;
  currentTime: MotionValue<number>;
  lines: Line[];
}

/** 落地页中一张真实界面截图。 */
export interface LandingScreenshot {
  alt: string;
  src: StaticImageData;
}

/** “反复回到的地方”中的单个功能条目，对应听歌报告的 Top 歌曲行。 */
export interface LandingFavoriteFeature {
  detail: string;
  href: string;
  meta: string;
  screenshot: LandingScreenshot;
  title: string;
}

/** “六个场景”中的单个使用场景。 */
export interface LandingDayMoment {
  feature: string;
  scene: string;
  screenshot: LandingScreenshot;
  sentence: string;
}

/** 与客户端「外观 → 精选主题」一致的背景渐变预设。 */
export interface LandingThemePreset {
  bottom: string;
  id: string;
  name: string;
  top: string;
}

export interface LandingVisualizerMode {
  label: string;
  value: string;
}
