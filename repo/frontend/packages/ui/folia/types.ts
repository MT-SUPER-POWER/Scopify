export type FoliaThemeVariant = "dark" | "light";

export interface FoliaThemeColors {
  accentColor: string;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface FoliaStageTheme {
  dark: FoliaThemeColors;
  id: string;
  light: FoliaThemeColors;
  name: string;
}

export interface Theme {
  accentColor: string;
  animationIntensity: "calm" | "normal" | "chaotic";
  backgroundColor: string;
  description?: string;
  fontFamily?: string;
  fontFamilyStack?: string[];
  fontStyle: "sans" | "serif" | "mono";
  fontWeight?: number;
  lyricsIcons?: string[];
  name: string;
  primaryColor: string;
  provider?: string;
  secondaryColor: string;
  wordColors?: { color: string; word: string }[];
}

export interface DualTheme {
  dark: Theme;
  light: Theme;
}
