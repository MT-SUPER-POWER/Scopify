import type { ReactNode } from "react";

export interface ShadcnExampleProps {
  children?: ReactNode;
  className?: string;
  code: string;
  label?: string;
  lang?: string;
  name?: ShadcnPreviewName;
  align?: "center" | "start" | "end";
  direction?: "ltr" | "rtl";
  hideCode?: boolean;
  previewClassName?: string;
}

export interface ShadcnCodeExampleProps {
  code: string;
  lang?: string;
}

export type ShadcnButtonExampleName =
  | "basic"
  | "variants"
  | "sizes"
  | "icons"
  | "loading"
  | "disabled"
  | "group"
  | "link"
  | "controlled";

export interface ShadcnButtonExampleProps {
  example: ShadcnButtonExampleName;
}

export interface ShadcnComponentExampleProps {
  name: ShadcnPreviewName;
}

export type ShadcnPreviewName =
  | "shadcn-accordion"
  | "shadcn-alert"
  | "shadcn-alert-dialog"
  | "shadcn-aspect-ratio"
  | "shadcn-attachment"
  | "shadcn-avatar"
  | "shadcn-badge"
  | "shadcn-breadcrumb"
  | "shadcn-bubble"
  | "shadcn-button"
  | "shadcn-button-group"
  | "shadcn-calendar"
  | "shadcn-card"
  | "shadcn-carousel"
  | "shadcn-chart"
  | "shadcn-checkbox"
  | "shadcn-collapsible"
  | "shadcn-combobox"
  | "shadcn-command"
  | "shadcn-context-menu"
  | "shadcn-dialog"
  | "shadcn-direction"
  | "shadcn-drawer"
  | "shadcn-dropdown-menu"
  | "shadcn-empty"
  | "shadcn-field"
  | "shadcn-form"
  | "shadcn-hover-card"
  | "shadcn-input"
  | "shadcn-input-group"
  | "shadcn-input-otp"
  | "shadcn-item"
  | "shadcn-kbd"
  | "shadcn-label"
  | "shadcn-marker"
  | "shadcn-menubar"
  | "shadcn-message"
  | "shadcn-message-scroller"
  | "shadcn-native-select"
  | "shadcn-navigation-menu"
  | "shadcn-pagination"
  | "shadcn-popover"
  | "shadcn-progress"
  | "shadcn-radio-group"
  | "shadcn-resizable"
  | "shadcn-scroll-area"
  | "shadcn-select"
  | "shadcn-separator"
  | "shadcn-sheet"
  | "shadcn-sidebar"
  | "shadcn-skeleton"
  | "shadcn-slider"
  | "shadcn-sonner"
  | "shadcn-spinner"
  | "shadcn-switch"
  | "shadcn-table"
  | "shadcn-tabs"
  | "shadcn-textarea"
  | "shadcn-toggle"
  | "shadcn-toggle-group"
  | "shadcn-tooltip";

export type ComponentPreviewName = ShadcnPreviewName;

export interface ComponentPreviewProps {
  name: ComponentPreviewName;
}

export interface ShadcnPreviewProps {
  name: ShadcnPreviewName;
}
