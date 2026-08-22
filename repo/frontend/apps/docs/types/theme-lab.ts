import type { CSSProperties } from "react";

export type ThemeLabScope = "shadcn" | "scopify";
export type ThemeMode = "light" | "dark";
export type ThemeTokenKind = "color" | "dimension" | "font" | "shadow";
export type ThemeTokenLayer = "shadcn" | "scopify";
export type ThemeTokenName = `--${string}`;
export type ThemePrototypeControlTab = "colors" | "typography" | "other" | "generate";

export interface ThemeTokenDefinition {
  group: string;
  kind: ThemeTokenKind;
  label: string;
  layer: ThemeTokenLayer;
  name: ThemeTokenName;
  shared?: boolean;
}

export type ThemeTokenValues = Record<ThemeTokenName, string>;

export interface ThemeDraft {
  dark: ThemeTokenValues;
  light: ThemeTokenValues;
}

export interface ThemeCssArtifact {
  css: string;
  filename: string;
  label: string;
}

export interface ThemePrototypeRecord {
  draft: ThemeDraft;
  id: string;
  name: string;
}

export interface ThemePrototypeContextValue {
  activeTheme?: ThemePrototypeRecord;
  activeThemeId: string;
  applyTheme: (themeId: string) => void;
  mode: ThemeMode;
  saveTheme: (themeId: string, draft: ThemeDraft) => string;
  setMode: (mode: ThemeMode) => void;
  themes: ThemePrototypeRecord[];
}

export type ThemePreviewStyle = CSSProperties & Partial<Record<ThemeTokenName, string>>;

export interface ThemeControlPanelProps {
  definitions: readonly ThemeTokenDefinition[];
  layer: ThemeTokenLayer;
  mode: ThemeMode;
  onLayerChange: (layer: ThemeTokenLayer) => void;
  onModeChange: (mode: ThemeMode) => void;
  onTokenChange: (definition: ThemeTokenDefinition, value: string) => void;
  scope: ThemeLabScope;
  values: ThemeTokenValues;
}

export interface ThemePrototypeActionBarProps {
  mode: ThemeMode;
  onExport: () => void;
  onModeChange: (mode: ThemeMode) => void;
  onReset: () => void;
  onSave: () => void;
}

export interface ThemePrototypeControlsProps {
  definitions: readonly ThemeTokenDefinition[];
  onTokenChange: (definition: ThemeTokenDefinition, value: string) => void;
  values: ThemeTokenValues;
}

export interface ThemePrototypeSecondaryControlsProps extends ThemePrototypeControlsProps {
  tab: Exclude<ThemePrototypeControlTab, "colors">;
}

export interface ThemePrototypePreviewPanelProps {
  draft: ThemeDraft;
  mode: ThemeMode;
  themeId: string;
}

export interface ThemePrototypePresetBarProps {
  mode: ThemeMode;
  onThemeIdChange: (value: string) => void;
  themeId: string;
  values: ThemeTokenValues;
}

export interface ThemePrototypeTokenRowProps {
  definition: ThemeTokenDefinition;
  onChange: (value: string) => void;
  value: string;
}

export interface ThemePrototypeFieldProps {
  label: string;
  placeholder: string;
  type?: string;
}

export interface ThemePrototypeMetricCardProps {
  description: string;
  path: string;
  title: string;
  value: string;
}

export interface ThemePrototypePlanProps {
  description: string;
  id: string;
  label: string;
}
