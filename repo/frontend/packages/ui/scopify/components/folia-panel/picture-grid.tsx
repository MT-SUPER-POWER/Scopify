"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

import {
  kitTransition,
  useKitReducedMotion,
} from "@scopify/ui/scopify/components/folia-panel/motion";

// Folia settings kit picture grids (kit/PictureGrid.tsx, kit/PictureChecks.tsx,
// kit/usePicturesInView.ts): options that differ in look, drawn as pictures in a fixed number of
// columns with the name under each. PictureGrid chooses one (an accent ring slides to it);
// PictureChecks switches each on and off. A grid with more rows than its height scrolls inside
// itself and its last row in view fades.

/** Around the pictures, inside the grid: the ring is drawn 3px outside its picture. */
const RING_ROOM = 4;
const FADE = 40;
const FADE_MASK = `linear-gradient(#000 calc(100% - ${FADE}px), transparent)`;
const GRID_CLASS =
  "st-scroll relative grid min-h-0 content-start gap-3 overflow-y-auto overscroll-contain p-1 [scrollbar-gutter:stable_both-edges]";

export type FoliaPictureState = {
  /** On screen at this moment. */
  visible: boolean;
  chosen: boolean;
  /** The pointer is on it. */
  active: boolean;
};

type PictureOption<T extends string> = { value: T; label: string };

const NONE: ReadonlySet<string> = new Set();

/** The values of the tiles under `rootRef` (each marked `data-value`) that are on screen now. */
function usePicturesInView(rootRef: RefObject<HTMLElement | null>, values: string) {
  const [seen, setSeen] = useState(NONE);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const offered = new Set(values.split("\n"));
    if (typeof IntersectionObserver === "undefined") {
      setSeen(offered);
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      setSeen((before) => {
        const after = new Set([...before].filter((tile) => offered.has(tile)));
        for (const entry of entries) {
          const tile = (entry.target as HTMLElement).dataset.value ?? "";
          if (entry.isIntersecting) after.add(tile);
          else after.delete(tile);
        }
        return after;
      });
    });
    root.querySelectorAll("[data-value]").forEach((tile) => observer.observe(tile));
    return () => observer.disconnect();
  }, [rootRef, values]);

  return seen;
}

const valueAt = <T extends string>(target: EventTarget) =>
  (target as Element).closest<HTMLElement>("[data-value]")?.dataset.value as T | undefined;

type TileProps<T extends string> = FoliaPictureState & {
  value: T;
  label: string;
  picture: (value: T, state: FoliaPictureState) => ReactNode;
  tabStop: boolean;
  markId: string;
  reduced: boolean;
};

const Tile = memo(
  <T extends string>({
    value,
    label,
    picture,
    tabStop,
    markId,
    reduced,
    ...state
  }: TileProps<T>) => (
    <div
      role="radio"
      aria-checked={state.chosen}
      data-value={value}
      tabIndex={tabStop ? 0 : -1}
      className="group flex min-w-0 cursor-pointer flex-col rounded-lg text-xs leading-4.5 select-none focus:outline-none"
    >
      <span className="relative block aspect-16/10 w-full">
        <span
          aria-hidden
          className="st-t-fast absolute inset-0 overflow-hidden rounded-lg bg-[var(--st-pv)] transition-transform group-active:scale-[0.97]"
        >
          {picture(value, state)}
          <span className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_0_0_1px_var(--st-line)]" />
        </span>
        {state.chosen ? (
          <motion.span
            layoutId={markId}
            layoutDependency={value}
            transition={kitTransition("move", reduced)}
            className="absolute -inset-[3px] rounded-[11px] shadow-[inset_0_0_0_2px_var(--st-accent)]"
          />
        ) : null}
      </span>
      <span
        className={`st-t-fast mt-1.5 block w-full truncate text-center transition-colors ${state.chosen ? "font-semibold text-[color:var(--st-t1)]" : "text-[color:var(--st-t2)] group-hover:text-[color:var(--st-t1)]"}`}
      >
        {label}
      </span>
    </div>
  ),
) as <T extends string>(props: TileProps<T>) => ReactElement;

/**
 * Chooses one picture. Tab reaches the chosen picture; the arrows move the choice, Home and End jump
 * to the ends. Give `picture` the same function each time (each tile redraws only on its own state).
 */
export function FoliaPictureGrid<T extends string>({
  value,
  options,
  picture,
  columns,
  onChange,
  label,
  maxHeight,
  className = "",
}: {
  value: T;
  options: ReadonlyArray<PictureOption<T>>;
  picture: (value: T, state: FoliaPictureState) => ReactNode;
  columns: number;
  onChange: (value: T) => void;
  label: string;
  maxHeight?: number;
  className?: string;
}) {
  const markId = useId();
  const reduced = useKitReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [pointed, setPointed] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const values = options.map((option) => option.value).join("\n");
  const chosenAt = options.findIndex((option) => option.value === value);
  const seen = usePicturesInView(rootRef, values);

  // Brings the chosen picture into view, clear of the fade, and says whether more rows follow.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const tile = root?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!root) return;
    if (tile) {
      if (tile.offsetTop - RING_ROOM < root.scrollTop) {
        root.scrollTop = tile.offsetTop - RING_ROOM;
      } else if (tile.offsetTop + tile.offsetHeight > root.scrollTop + root.clientHeight - FADE) {
        root.scrollTop = tile.offsetTop + tile.offsetHeight - root.clientHeight + FADE;
      }
    }
    setMore(root.scrollHeight - root.scrollTop - root.clientHeight > 2);
  }, [value, values, columns]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    if (key === "Enter" || key === " ") {
      event.preventDefault();
      event.stopPropagation();
      const next = valueAt<T>(event.target);
      if (next !== undefined && next !== value) onChange(next);
      return;
    }
    const last = options.length - 1;
    const step =
      key === "ArrowRight"
        ? 1
        : key === "ArrowLeft"
          ? -1
          : key === "ArrowDown"
            ? columns
            : key === "ArrowUp"
              ? -columns
              : 0;
    if (
      (!step && key !== "Home" && key !== "End") ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    const keyAt = options.findIndex((option) => option.value === valueAt<T>(event.target));
    const from = keyAt >= 0 ? keyAt : chosenAt;
    let next =
      key === "Home" ? 0 : key === "End" ? last : Math.max(0, from) + (from < 0 ? 0 : step);
    if (
      step === columns &&
      next > last &&
      Math.floor(from / columns) < Math.floor(last / columns)
    ) {
      next = last;
    }
    if (next < 0 || next > last || next === from) return;
    event.currentTarget.querySelectorAll<HTMLElement>("[data-value]")[next].focus();
    if (next !== chosenAt) onChange(options[next].value);
  };

  return (
    <motion.div
      ref={rootRef}
      layoutScroll
      role="radiogroup"
      aria-label={label}
      onClick={(event) => {
        const next = valueAt<T>(event.target);
        if (next !== undefined && next !== value) onChange(next);
      }}
      onKeyDown={handleKeyDown}
      onPointerOver={(event) => setPointed(valueAt<T>(event.target) ?? null)}
      onPointerLeave={() => setPointed(null)}
      onScroll={(event) => {
        const root = event.currentTarget;
        setMore(root.scrollHeight - root.scrollTop - root.clientHeight > 2);
      }}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        maxHeight,
        ...(more ? { maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK } : {}),
      }}
      className={`${GRID_CLASS} ${className}`}
    >
      {options.map((option, index) => (
        <Tile
          key={option.value}
          value={option.value}
          label={option.label}
          picture={picture}
          visible={seen.has(option.value)}
          chosen={index === chosenAt}
          active={option.value === pointed}
          tabStop={index === Math.max(0, chosenAt)}
          markId={markId}
          reduced={reduced}
        />
      ))}
    </motion.div>
  );
}

/**
 * Switches each picture on and off by itself. A picture that is on has the accent ring and a tick;
 * `least` keeps that many on, and a press that would leave fewer calls `onRefuse` instead.
 * `compact` gives glyph choices a low frame instead of 16 by 10.
 */
export function FoliaPictureChecks<T extends string>({
  value,
  options,
  picture,
  columns,
  onChange,
  label,
  least = 0,
  onRefuse,
  maxHeight,
  compact = false,
  className = "",
}: {
  value: readonly T[];
  options: ReadonlyArray<PictureOption<T>>;
  picture: (value: T) => ReactNode;
  columns: number;
  /** The options that are on after a press, in the options' order. */
  onChange: (value: T[]) => void;
  label: string;
  least?: number;
  onRefuse?: () => void;
  maxHeight?: number;
  compact?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const on = new Set<string>(value);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root) setMore(root.scrollHeight - root.scrollTop - root.clientHeight > 2);
  }, [options.length, columns]);

  const toggle = (target: T) => {
    if (on.has(target)) {
      if (on.size <= least) {
        onRefuse?.();
        return;
      }
      on.delete(target);
    } else {
      on.add(target);
    }
    onChange(options.map((option) => option.value).filter((option) => on.has(option)));
  };

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={label}
      onScroll={(event) => {
        const root = event.currentTarget;
        setMore(root.scrollHeight - root.scrollTop - root.clientHeight > 2);
      }}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        maxHeight,
        ...(more ? { maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK } : {}),
      }}
      className={`${GRID_CLASS} ${className}`}
    >
      {options.map((option) => {
        const isOn = on.has(option.value);
        return (
          <div
            key={option.value}
            role="checkbox"
            aria-checked={isOn}
            data-value={option.value}
            tabIndex={0}
            onClick={() => toggle(option.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(option.value);
              }
            }}
            className="group flex min-w-0 cursor-pointer flex-col rounded-lg text-xs leading-4.5 select-none focus:outline-none"
          >
            <span className={`relative block w-full ${compact ? "h-14" : "aspect-16/10"}`}>
              <span
                aria-hidden
                className={`st-t-fast absolute inset-0 overflow-hidden rounded-lg bg-[var(--st-pv)] transition-[opacity,transform] group-active:scale-[0.97] ${isOn ? "" : "opacity-40 group-hover:opacity-70"}`}
              >
                {picture(option.value)}
                <span className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_0_0_1px_var(--st-line)]" />
              </span>
              {isOn ? (
                <span
                  aria-hidden
                  className="absolute -inset-[3px] rounded-[11px] shadow-[inset_0_0_0_2px_var(--st-accent)]"
                />
              ) : null}
              <span
                aria-hidden
                className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/35"
              >
                <span
                  className={`st-t-fast grid h-4 w-4 place-items-center rounded-[5px] transition-[background-color,box-shadow] ${isOn ? "bg-[var(--st-accent)] text-[color:var(--st-on-accent)]" : "shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.7)]"}`}
                >
                  <Check
                    size={12}
                    strokeWidth={3}
                    className={`st-t-move transition-[opacity,scale] ${isOn ? "" : "scale-50 opacity-0"}`}
                  />
                </span>
              </span>
            </span>
            <span
              className={`st-t-fast mt-1.5 block w-full truncate text-center transition-colors ${isOn ? "font-semibold text-[color:var(--st-t1)]" : "text-[color:var(--st-t3)] group-hover:text-[color:var(--st-t1)]"}`}
            >
              {option.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
