import React, { createContext, useContext } from "react";
import type { TranslationKey } from "@/lib/i18n";
import type { Theme } from "../../types";
import { colorWithAlpha } from "./colorMix";

// src/components/visualizer/panelRows.tsx
// Upstream draws the option panels of Machi and Nebbia with its settings window's kit
// (components/modal/settings/kit: Group, Row, Segmented, Slider, Toggle, PictureGrid, Button) and the
// shared rows in visualizer/panelRows.tsx. Scopify has no such kit; its lyric panels are cards of
// sections and pills (TemperaSettingsSection, VisualizerPresetGroup). This file keeps the upstream
// names and call shapes on top of that look, so the two panels read like the originals.
// The host (PanelFrame) gives the rows its theme, its translator and its range-input class once.

export interface SettingsGroupDef {
  id: string;
  titleKey: TranslationKey;
}

interface PanelRowsContextValue {
  t: (key: TranslationKey) => string;
  isDaylight: boolean;
  theme: Theme;
  rangeInputClass: string;
}

const PanelRowsContext = createContext<PanelRowsContextValue | null>(null);

const usePanelRows = (): PanelRowsContextValue => {
  const context = useContext(PanelRowsContext);
  if (!context) throw new Error("[panelRows] rows must sit inside a PanelFrame");
  return context;
};

export const percent = (value: number) => `${Math.round(value * 100)}%`;
export const times = (value: number) => `${value.toFixed(2)}x`;

interface PanelFrameProps {
  title: string;
  description?: string;
  t: (key: TranslationKey) => string;
  isDaylight: boolean;
  theme: Theme;
  controlCardBg: string;
  rangeInputClass: string;
  children: React.ReactNode;
}

/** The card a lyric style's panel is drawn in (the same one Hanabi and Tempera use). */
export const PanelFrame: React.FC<PanelFrameProps> = ({
  title,
  description,
  t,
  isDaylight,
  theme,
  controlCardBg,
  rangeInputClass,
  children,
}) => (
  <PanelRowsContext.Provider value={{ t, isDaylight, theme, rangeInputClass }}>
    <div
      className="space-y-4 rounded-[24px] border border-white/10 p-4"
      style={{ backgroundColor: controlCardBg }}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {title}
        </div>
        {description ? (
          <div className="text-xs opacity-50" style={{ color: "var(--text-secondary)" }}>
            {description}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  </PanelRowsContext.Provider>
);

interface GroupProps {
  def: SettingsGroupDef;
  /** A line of explanation under the group. */
  foot?: React.ReactNode;
  /** A control at the end of the title line. */
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const Group: React.FC<GroupProps> = ({ def, foot, action, children }) => {
  const { t } = usePanelRows();
  return (
    <section className="space-y-4 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h3
          className="text-xs font-medium tracking-[0.24em] uppercase opacity-45"
          style={{ color: "var(--text-secondary)" }}
        >
          {t(def.titleKey)}
        </h3>
        {action}
      </div>
      {children}
      {foot ? (
        <p
          className="text-xs leading-relaxed opacity-55"
          style={{ color: "var(--text-secondary)" }}
        >
          {foot}
        </p>
      ) : null}
    </section>
  );
};

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs leading-relaxed opacity-55" style={{ color: "var(--text-secondary)" }}>
    {children}
  </p>
);

interface RowProps {
  label?: React.ReactNode;
  note?: React.ReactNode;
  /** Full-width content under the label and note (a picture grid). */
  below?: React.ReactNode;
  /** Drawn as a detail of the row above it. */
  sub?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const Row: React.FC<RowProps> = ({ label, note, below, sub, disabled, children }) => (
  <div
    className={`space-y-2.5 ${sub ? "pl-3" : ""} ${disabled ? "pointer-events-none opacity-45" : ""}`}
    aria-disabled={disabled || undefined}
  >
    {label ? (
      <div className="text-sm" style={{ color: "var(--text-primary)" }}>
        {label}
      </div>
    ) : null}
    {children}
    {below}
    {note ? <Note>{note}</Note> : null}
  </div>
);

interface SegmentedProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

export const Segmented = <T extends string>({ value, options, onChange }: SegmentedProps<T>) => {
  const { isDaylight, theme } = usePanelRows();
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className="rounded-full border px-3 py-2 text-sm transition-all"
            style={{
              color: theme.primaryColor,
              borderColor: isActive
                ? theme.accentColor
                : colorWithAlpha(theme.secondaryColor, isDaylight ? 0.18 : 0.14),
              backgroundColor: isActive
                ? colorWithAlpha(theme.accentColor, isDaylight ? 0.1 : 0.16)
                : colorWithAlpha(theme.backgroundColor, isDaylight ? 0.24 : 0.34),
              boxShadow: isActive ? `inset 0 0 0 1px ${theme.accentColor}` : "none",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

interface ButtonProps {
  variant?: "quiet";
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-full px-2.5 py-1 text-xs transition-opacity hover:opacity-100"
    style={{ color: "var(--text-secondary)", opacity: 0.75 }}
  >
    {children}
  </button>
);

interface PictureGridProps<T extends string> {
  className?: string;
  columns?: number;
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  /** What fills the tile of an option. */
  picture: (value: T) => React.ReactNode;
  onChange: (value: T) => void;
}

export const PictureGrid = <T extends string>({
  className,
  columns = 3,
  label,
  value,
  options,
  picture,
  onChange,
}: PictureGridProps<T>) => {
  const { isDaylight, theme } = usePanelRows();
  return (
    <div
      className={`grid gap-2 ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className="flex flex-col items-center gap-1.5 rounded-2xl border p-2 text-xs transition-all"
            style={{
              color: theme.primaryColor,
              borderColor: isActive
                ? theme.accentColor
                : colorWithAlpha(theme.secondaryColor, isDaylight ? 0.18 : 0.14),
              backgroundColor: isActive
                ? colorWithAlpha(theme.accentColor, isDaylight ? 0.1 : 0.16)
                : colorWithAlpha(theme.backgroundColor, isDaylight ? 0.24 : 0.34),
              boxShadow: isActive ? `inset 0 0 0 1px ${theme.accentColor}` : "none",
            }}
          >
            <span className="relative block aspect-[4/3] w-full">{picture(option.value)}</span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

interface SliderRowProps {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  /** A pointer took hold of the slider: until onDragEnd the host keeps the values as a draft. */
  onDragStart?: () => void;
  /** The pointer let go, wherever it was by then. */
  onDragEnd?: () => void;
  note?: React.ReactNode;
  sub?: boolean;
  disabled?: boolean;
}

/** A row that is one slider: the value ends the label's line, the track spans the row. */
export const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  onDragStart,
  onDragEnd,
  note,
  sub,
  disabled,
}) => {
  const { rangeInputClass } = usePanelRows();
  return (
    <div
      className={`space-y-2 ${sub ? "pl-3" : ""} ${disabled ? "pointer-events-none opacity-45" : ""}`}
    >
      <div
        className="flex items-center justify-between gap-3 text-sm"
        style={{ color: "var(--text-primary)" }}
      >
        <span>{label}</span>
        <span className="shrink-0 font-mono opacity-70" style={{ color: "var(--text-secondary)" }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerDown={onDragStart}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        className={rangeInputClass}
      />
      {note ? <Note>{note}</Note> : null}
    </div>
  );
};

interface ToggleRowProps {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  note?: React.ReactNode;
  sub?: boolean;
  disabled?: boolean;
}

/** A row that is one switch. */
export const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  checked,
  onChange,
  note,
  sub,
  disabled,
}) => {
  const { isDaylight, theme } = usePanelRows();
  return (
    <div className={`space-y-1.5 ${sub ? "pl-3" : ""} ${disabled ? "opacity-45" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
          {label}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={typeof label === "string" ? label : undefined}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className="relative h-6 w-10 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed"
          style={{
            borderColor: checked
              ? theme.accentColor
              : colorWithAlpha(theme.secondaryColor, isDaylight ? 0.28 : 0.24),
            backgroundColor: checked
              ? colorWithAlpha(theme.accentColor, isDaylight ? 0.35 : 0.45)
              : colorWithAlpha(theme.backgroundColor, isDaylight ? 0.24 : 0.34),
          }}
        >
          <span
            className="absolute top-0.5 size-4 rounded-full transition-all"
            style={{
              left: checked ? "calc(100% - 1.125rem)" : "0.125rem",
              backgroundColor: checked ? theme.accentColor : theme.secondaryColor,
            }}
          />
        </button>
      </div>
      {note ? <Note>{note}</Note> : null}
    </div>
  );
};
