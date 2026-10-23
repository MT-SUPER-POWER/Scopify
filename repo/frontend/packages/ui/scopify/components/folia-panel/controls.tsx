"use client";

import { motion } from "framer-motion";
import { ChevronRight, Minus, Plus, type LucideIcon } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";

import {
  kitTransition,
  useKitReducedMotion,
} from "@scopify/ui/scopify/components/folia-panel/motion";
import { FoliaTooltip } from "@scopify/ui/scopify/components/folia-panel/tooltip";

// The player panel's parts, ported from Folia (panelTab/shell/*, panelTab/controls/QuickTile.tsx,
// PanelSlider.tsx, shared/QuickControlChip.tsx, kit/Toggle.tsx). They read every colour from the
// --st-* variables the panel surface sets, so light and dark follow the surface.

/** The line between two groups of rows in a panel tab. */
export function FoliaGroupLine() {
  return <div className="mx-1 my-2 h-px bg-[var(--st-line)]" />;
}

/** An icon that takes another one's place comes in a little small; the first icon does not move. */
export function FoliaIconSwap({
  name,
  speed = "fast",
  children,
}: {
  name?: string;
  speed?: "fast" | "move";
  children: ReactNode;
}) {
  const reduced = useKitReducedMotion();
  const hasShownRef = useRef(false);
  useEffect(() => {
    hasShownRef.current = true;
  }, []);

  return (
    <motion.span
      key={name}
      initial={hasShownRef.current ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={kitTransition(speed, reduced)}
      className="block"
    >
      {children}
    </motion.span>
  );
}

const ICON_BUTTON_SIZE = {
  s: "h-7 w-7 rounded-lg",
  m: "h-8 w-8 rounded-lg",
  l: "h-10 w-10 rounded-[10px]",
} as const;

/**
 * A button that is only an icon. Its name is its tooltip and accessible name. Out of reach it is
 * dimmed and does nothing, but still takes the pointer so the tooltip can say why.
 */
export function FoliaIconButton({
  label,
  size = "m",
  filled,
  pressed,
  disabled,
  className,
  onClick,
  children,
  ...button
}: Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "disabled" | "title" | "aria-label" | "className"
> & {
  label: string;
  size?: keyof typeof ICON_BUTTON_SIZE;
  filled?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <FoliaTooltip
      text={label}
      className={`inline-flex shrink-0${className ? ` ${className}` : ""}`}
    >
      <button
        type="button"
        {...button}
        aria-label={label}
        aria-pressed={pressed}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onClick}
        className={`st-t-fast st-focus-inside grid place-items-center text-[color:var(--st-t2)] transition-[background-color,color,opacity,scale] ${ICON_BUTTON_SIZE[size]} ${filled ? "bg-[var(--st-fill)]" : ""} ${
          disabled
            ? "cursor-not-allowed opacity-40"
            : `hover:text-[color:var(--st-t1)] active:scale-[0.96] ${filled ? "hover:bg-[var(--st-fill2)]" : "hover:bg-[var(--st-fill)]"}`
        }`}
      >
        {children}
      </button>
    </FoliaTooltip>
  );
}

/** A button that says what it does: an icon and a name on a filled ground. */
export function FoliaPanelButton({
  icon: Icon,
  grow,
  children,
  buttonRef,
  ...button
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "className"> & {
  icon?: LucideIcon;
  /** Shares the width of its row with its neighbours. */
  grow?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
  children: ReactNode;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      {...button}
      className={`st-t-fast inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[var(--st-fill)] px-3 text-[13px] whitespace-nowrap text-[color:var(--st-t1)] transition-[background-color,opacity,scale] enabled:hover:bg-[var(--st-fill2)] enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 ${grow ? "flex-[1_1_auto]" : "shrink-0"}`}
    >
      {Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  );
}

/** A row of a panel tab: a name at the left (and one short hint under it), its control at the right. */
export function FoliaPanelRow({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
}) {
  const labelId = useId();

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex min-h-11 flex-wrap items-center gap-x-3 px-1 py-1.5"
    >
      <div className="min-w-0 flex-[1_1_72px]">
        <div id={labelId} className="text-sm leading-5">
          {label}
        </div>
        {hint ? <div className="text-xs leading-4 text-[color:var(--st-t3)]">{hint}</div> : null}
      </div>
      {children ? (
        <div className="ml-auto flex max-w-full min-w-0 items-center gap-1.5">{children}</div>
      ) : null}
    </div>
  );
}

export type FoliaSegment<T extends string> = {
  value: T;
  /** The name; where only the icon shows, the tooltip and accessible name. */
  label: string;
  icon?: ReactNode;
  iconOnly?: boolean;
  disabled?: boolean;
  /** A tooltip in place of the name: why the option is out of reach. */
  tip?: string;
};

const SEGMENT_SIZE = {
  s: { box: "h-7 rounded-lg", option: "rounded-md", markRadius: 6 },
  m: { box: "h-8 rounded-lg", option: "rounded-md", markRadius: 6 },
  l: { box: "h-9 rounded-[10px]", option: "rounded-lg", markRadius: 8 },
} as const;

/**
 * A choice between a few options all in view (the tab row, a lyric source, replay gain). The raised
 * mark under the chosen option slides to a new choice.
 */
export function FoliaSegments<T extends string>({
  value,
  options,
  onChange,
  size = "m",
  fill,
}: {
  value: T;
  options: ReadonlyArray<FoliaSegment<T>>;
  /** Called for a new choice, not for a press on the chosen one. */
  onChange: (value: T) => void;
  size?: keyof typeof SEGMENT_SIZE;
  /** Takes the width of its row; the options share it. */
  fill?: boolean;
}) {
  const markId = useId();
  const reduced = useKitReducedMotion();
  const look = SEGMENT_SIZE[size];
  const hasIconOnly = options.some((option) => option.iconOnly);

  return (
    <div
      role="group"
      className={`${fill ? "flex w-full" : "inline-flex"} bg-[var(--st-fill)] p-0.5 ${look.box}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const share = !fill
          ? `shrink-0${option.iconOnly ? " w-[30px]" : ""}`
          : option.iconOnly
            ? "min-w-0 flex-[1_1_36px]"
            : `min-w-0 ${hasIconOnly ? "flex-[0_1_auto]" : "flex-[1_1_auto]"}`;
        return (
          <FoliaTooltip
            key={option.value}
            text={option.tip ?? (option.iconOnly ? option.label : undefined)}
            className={`flex ${share}`}
          >
            <button
              type="button"
              aria-pressed={selected}
              aria-label={option.iconOnly ? option.label : undefined}
              aria-disabled={option.disabled || undefined}
              onClick={() => {
                if (!selected && !option.disabled) onChange(option.value);
              }}
              className={`st-t-fast st-focus-inside relative flex h-full w-full min-w-0 items-center justify-center text-[13px] whitespace-nowrap transition-[color,opacity] ${look.option} ${option.iconOnly ? "" : "px-2.5"} ${option.disabled ? "cursor-not-allowed opacity-40" : ""} ${
                selected
                  ? "text-[color:var(--st-t1)]"
                  : `text-[color:var(--st-t2)]${option.disabled ? "" : "hover:text-[color:var(--st-t1)]"}`
              }`}
            >
              {selected ? (
                <motion.span
                  layoutId={markId}
                  layoutDependency={value}
                  transition={kitTransition("move", reduced)}
                  className="absolute inset-0 bg-[var(--st-raise)]"
                  style={{
                    borderRadius: look.markRadius,
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                  }}
                />
              ) : null}
              <span className="relative flex min-w-0 items-center gap-1.5">
                {option.icon}
                {!option.iconOnly ? <span className="truncate">{option.label}</span> : null}
              </span>
            </button>
          </FoliaTooltip>
        );
      })}
    </div>
  );
}

const STEP_BUTTON_CLASS =
  "st-t-fast st-focus-inside grid h-full w-7 place-items-center rounded-lg text-[color:var(--st-t2)] transition-colors hover:bg-[var(--st-fill2)] hover:text-[color:var(--st-t1)]";

const parseNumberText = (text: string): number | null => {
  const normalized = text.trim().replace(/^\+/, "").replace(/[−–]/g, "-");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
};

/** A number set in steps (minus, the number with its unit, plus); it can be typed too. */
export function FoliaStepper({
  value,
  onChange,
  step,
  label,
  unit = "",
  signed,
}: {
  value: number;
  onChange: (value: number) => void;
  step: number;
  label: string;
  unit?: string;
  /** Shows a plus before a number above zero. */
  signed?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const stepBy = (direction: 1 | -1) => {
    onChange(value + direction * step);
    setDraft(null);
  };
  const stepButton = (direction: 1 | -1) => {
    const name = `${direction === 1 ? "+" : "-"}${step}${unit}`;
    return (
      <FoliaTooltip text={name} className="flex h-full">
        <button
          type="button"
          aria-label={name}
          onClick={() => stepBy(direction)}
          className={STEP_BUTTON_CLASS}
        >
          {direction === 1 ? <Plus size={14} /> : <Minus size={14} />}
        </button>
      </FoliaTooltip>
    );
  };

  return (
    <span className="st-t-fast inline-flex h-8 shrink-0 items-center rounded-lg border border-transparent bg-[var(--st-fill)] transition-colors has-[input:focus]:border-[var(--st-accent)]">
      {stepButton(-1)}
      <input
        type="text"
        inputMode="numeric"
        role="spinbutton"
        aria-label={label}
        aria-valuenow={value}
        value={draft ?? (signed && value > 0 ? `+${value}` : String(value))}
        spellCheck={false}
        onChange={(event) => {
          setDraft(event.target.value);
          const typed = parseNumberText(event.target.value);
          if (typed !== null) onChange(typed);
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            setDraft(null);
          } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            stepBy(event.key === "ArrowUp" ? 1 : -1);
          }
        }}
        className="h-full w-12 min-w-0 bg-transparent text-right font-mono text-[13px] text-[color:var(--st-t1)] outline-none"
      />
      {unit ? (
        <span className="pr-1 pl-[3px] font-mono text-xs text-[color:var(--st-t3)]">{unit}</span>
      ) : null}
      {stepButton(1)}
    </span>
  );
}

const THUMB_PX = 16;
const KEY_STEP = 0.05;
const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

/**
 * A slider for a value tried out while the thumb moves and kept when it is let go: every move calls
 * onPreview, letting go calls onCommit. A press on the thumb that does not move it sends no value.
 */
export function FoliaSlider({
  value,
  onPreview,
  onCommit,
  label,
  valueText,
}: {
  /** From 0 to 1. */
  value: number;
  onPreview: (value: number) => void;
  onCommit: () => void;
  label: string;
  valueText: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHeld, setIsHeld] = useState(false);
  const shown = clampUnit(value);
  const grabRef = useRef(0);
  const lastXRef = useRef(0);

  const valueAt = (centreX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    return (
      Math.round(clampUnit((centreX - rect.left - THUMB_PX / 2) / (rect.width - THUMB_PX)) * 100) /
      100
    );
  };

  const release = () => {
    setIsHeld(false);
    onCommit();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const next =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? (Math.floor(shown / KEY_STEP + 1e-6) + 1) * KEY_STEP
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? (Math.ceil(shown / KEY_STEP - 1e-6) - 1) * KEY_STEP
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? 1
              : null;
    if (next === null) return;
    event.preventDefault();
    onPreview(Math.round(clampUnit(next) * 100) / 100);
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shown * 100)}
      aria-valuetext={valueText}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsHeld(true);
        lastXRef.current = event.clientX;
        const rect = event.currentTarget.getBoundingClientRect();
        const fromCentre =
          event.clientX - (rect.left + THUMB_PX / 2 + shown * (rect.width - THUMB_PX));
        if (Math.abs(fromCentre) <= THUMB_PX / 2) {
          grabRef.current = fromCentre;
          return;
        }
        grabRef.current = 0;
        onPreview(valueAt(event.clientX));
      }}
      onPointerMove={(event) => {
        if (!isHeld || event.buttons === 0 || event.clientX === lastXRef.current) return;
        lastXRef.current = event.clientX;
        onPreview(valueAt(event.clientX - grabRef.current));
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onKeyDown={handleKeyDown}
      onKeyUp={onCommit}
      onBlur={release}
      className="relative h-6 min-w-0 flex-1 cursor-pointer touch-none rounded-full"
    >
      <span className="absolute inset-x-0 top-2.5 h-1 overflow-hidden rounded-full bg-[var(--st-track)]">
        <span
          className="absolute inset-0 origin-left bg-[var(--st-accent)]"
          style={{ transform: `scaleX(${shown})` }}
        />
      </span>
      <span
        className="st-t-fast absolute top-1 h-4 w-4 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.14),0_1px_3px_rgba(0,0,0,0.35)] transition-transform"
        style={{
          left: `calc(${shown} * (100% - ${THUMB_PX}px))`,
          transform: isHeld ? "scale(1.15)" : undefined,
        }}
      />
    </div>
  );
}

/**
 * A tile of the controls tab: an icon above a name. A toggle tile is lit while its thing is on; a
 * tile that opens something carries a small arrow and can be lit to say that what it opens is in use.
 */
export function FoliaQuickTile({
  kind,
  icon,
  iconKey,
  label,
  lit,
  tip,
  ...button
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "title" | "className" | "children"> & {
  kind: "toggle" | "open";
  icon: ReactNode;
  /** Names the icon that shows: when it changes, the new icon comes in a little small. */
  iconKey?: string;
  label: string;
  lit: boolean;
  tip?: string;
}) {
  return (
    <FoliaTooltip text={tip} className="flex min-w-0">
      <button
        type="button"
        {...button}
        aria-pressed={kind === "toggle" ? lit : undefined}
        className={`st-t-fast flex min-h-16 w-full min-w-0 flex-col justify-between gap-2 rounded-[10px] px-2.5 pt-2.5 pb-[9px] text-left text-xs leading-4 transition-[background-color,color,box-shadow,scale] enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 ${
          lit
            ? "bg-[var(--st-raise)] text-[color:var(--st-t1)] shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            : "bg-[var(--st-fill)] text-[color:var(--st-t2)] enabled:hover:bg-[var(--st-fill2)]"
        }`}
      >
        <span
          className={`st-t-fast flex items-center justify-between transition-colors ${lit ? "text-[color:var(--st-accent)]" : "text-[color:var(--st-t3)]"}`}
        >
          <FoliaIconSwap name={iconKey}>{icon}</FoliaIconSwap>
          {kind === "open" ? <ChevronRight size={14} className="opacity-70" /> : null}
        </span>
        <span className="truncate">{label}</span>
      </button>
    </FoliaTooltip>
  );
}

const CHIP_BASE =
  "st-t-fast st-focus-inside inline-flex h-7 shrink-0 items-center justify-center rounded-lg transition-[background-color,color,box-shadow,scale,opacity] enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40";

/** A short text chip for one compact parameter (an animation intensity, a pool, a picked style). */
export function FoliaQuickChip({
  onClick,
  label,
  title,
  disabled,
  buttonRef,
  expanded,
}: {
  onClick: () => void;
  label: string;
  title: string;
  disabled?: boolean;
  /** For a chip that opens a layer: the button it opens from. */
  buttonRef?: Ref<HTMLButtonElement>;
  /** For a chip that opens a layer: whether it is open. */
  expanded?: boolean;
}) {
  return (
    <FoliaTooltip text={title} className="flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${CHIP_BASE} px-2.5 text-xs whitespace-nowrap enabled:hover:text-[color:var(--st-t1)] ${
          expanded
            ? "bg-[var(--st-fill2)] text-[color:var(--st-t1)]"
            : "bg-[var(--st-fill)] text-[color:var(--st-t2)] enabled:hover:bg-[var(--st-fill2)]"
        }`}
        aria-label={title}
        aria-haspopup={expanded === undefined ? undefined : "true"}
        aria-expanded={expanded}
      >
        {label}
      </button>
    </FoliaTooltip>
  );
}

/** An icon chip that is on or off. */
export function FoliaQuickToggle({
  active,
  onToggle,
  label,
  children,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <FoliaTooltip text={label} className="flex">
      <button
        type="button"
        onClick={onToggle}
        className={`${CHIP_BASE} w-7 ${
          active
            ? "bg-[var(--st-raise)] text-[color:var(--st-accent)] shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            : "bg-[var(--st-fill)] text-[color:var(--st-t3)] hover:bg-[var(--st-fill2)] hover:text-[color:var(--st-t1)]"
        }`}
        aria-label={label}
        aria-pressed={active}
      >
        {children}
      </button>
    </FoliaTooltip>
  );
}

/** The on/off switch of a row; the thumb glides to its side and widens while pressed. */
export function FoliaToggle({
  checked,
  onChange,
  disabled,
  labelledBy,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  labelledBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`st-t-move group relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${checked ? "bg-[var(--st-accent)]" : "bg-[var(--st-track)]"}`}
    >
      <span
        className={`st-t-move absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-[translate,width,background-color] group-enabled:group-active:w-[22px] ${
          checked
            ? "translate-x-4 bg-[var(--st-on-accent)] group-enabled:group-active:translate-x-3"
            : "bg-[var(--st-knob)]"
        }`}
      />
    </button>
  );
}
