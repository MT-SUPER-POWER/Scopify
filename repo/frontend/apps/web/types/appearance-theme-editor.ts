import type { ReactNode } from "react";

export interface NamedTheme {
  id: string;
  name: string;
}

export interface ThemeEditorFrameProps {
  title: string;
  readOnly?: boolean;
  saved?: boolean;
  missing?: boolean;
  dirty: boolean;
  valid: boolean;
  onReset: () => void;
  onSave: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

export interface ThemeEditorBoundaryProps {
  children: ReactNode;
}

export interface ThemeNameFieldProps {
  value: string;
  valid: boolean;
  onChange: (name: string) => void;
}

export interface BackgroundThemeEditorProps {
  themeId: string | null;
}

export interface ThemeColorControlProps {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange: (color: string) => void;
}
