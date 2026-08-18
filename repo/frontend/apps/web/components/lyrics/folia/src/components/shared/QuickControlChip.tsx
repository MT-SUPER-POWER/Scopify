import React from "react";
import type { Theme } from "../../types";

// src/components/shared/QuickControlChip.tsx
// 播放面板里紧凑参数控件的两种形态：短文字胶囊和图标开关。
// 放在 shared/ 下，让面板和各 visualizer 背景模式都能用，不产生反向依赖。

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
  isDaylight,
  iconOnly = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`${iconOnly ? "flex w-6 items-center justify-center bg-transparent opacity-65 hover:opacity-100" : `px-1.5 ${isDaylight ? "bg-white shadow-sm hover:bg-white/90" : "bg-white/20 shadow-sm hover:bg-white/30"}`} h-6 rounded-md text-[10px] font-bold transition-all`}
    title={title}
    aria-label={title}
  >
    {label}
  </button>
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
  theme,
  children,
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex size-6 items-center justify-center rounded-md transition-all ${active ? "" : "opacity-40 hover:opacity-100"}`}
    style={active ? { color: theme.accentColor } : undefined}
    title={label}
    aria-label={label}
    aria-pressed={active}
  >
    {children}
  </button>
);
