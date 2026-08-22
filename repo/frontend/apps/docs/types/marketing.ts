import type { StaticImageData } from "next/image";

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

export interface LandingStoryContent {
  align: "left" | "right";
  description: string;
  eyebrow: string;
  image: StaticImageData;
  imageAlt: string;
  title: string;
}
