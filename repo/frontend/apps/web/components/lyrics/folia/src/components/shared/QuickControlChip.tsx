import React from "react";
import {
  FoliaQuickChip,
  FoliaQuickToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import type { Theme } from "../../types";

// src/components/shared/QuickControlChip.tsx
// 播放面板里紧凑参数控件的两种形态：短文字胶囊和图标开关。
// 放在 shared/ 下，让面板和各 visualizer 背景模式都能用，不产生反向依赖。
// Scopify host adapter: drawn with the shared Folia panel kit (as Folia v0.7.22 does), so colours
// come from the panel's --st-* variables; `isDaylight` / `theme` stay for the vendored callers.

interface QuickControlChipProps {
  onClick: () => void;
  label: React.ReactNode;
  title: string;
  isDaylight: boolean;
  iconOnly?: boolean;
}

export const QuickControlChip: React.FC<QuickControlChipProps> = ({
  onClick,
  label,
  title,
  iconOnly = false,
}) =>
  iconOnly ? (
    <FoliaQuickToggle active={false} onToggle={onClick} label={title}>
      {label}
    </FoliaQuickToggle>
  ) : (
    <FoliaQuickChip
      onClick={onClick}
      label={typeof label === "string" ? label : title}
      title={title}
    />
  );

interface QuickControlToggleProps {
  active: boolean;
  onToggle: () => void;
  label: string;
  theme: Theme;
  children: React.ReactNode;
}

export const QuickControlToggle: React.FC<QuickControlToggleProps> = ({
  active,
  onToggle,
  label,
  children,
}) => (
  <FoliaQuickToggle active={active} onToggle={onToggle} label={label}>
    {children}
  </FoliaQuickToggle>
);
