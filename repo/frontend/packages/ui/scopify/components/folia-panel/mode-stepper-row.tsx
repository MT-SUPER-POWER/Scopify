"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, type ReactNode, type RefObject } from "react";

import {
  kitTransition,
  useKitReducedMotion,
} from "@scopify/ui/scopify/components/folia-panel/motion";
import {
  FoliaPictureGrid,
  type FoliaPictureState,
} from "@scopify/ui/scopify/components/folia-panel/picture-grid";
import { FoliaPopover } from "@scopify/ui/scopify/components/folia-panel/popover";

// Folia's player-panel mode rows (panelTab/controls/ModeStepperRow.tsx, panelTab/QuickEffectPicker.tsx):
// "‹ glyph caption/mode⌄ aside ›" on one line, the mode's other parameters on the line under it,
// right-aligned with the arrow. The arrows step to the neighbouring mode; the middle opens every
// mode as pictures. The glyph and name slide in from the step's side; the parameter line folds away
// with a height animation when a mode has none.

const STEP_ENTER_OFFSET_PX = 10;

/** The way on to the full settings at the bottom of a panel picker; it closes the picker first. */
export function FoliaPickerMoreButton({
  label,
  onClose,
  onOpenMore,
}: {
  label: string;
  onClose: () => void;
  onOpenMore: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onClose();
        onOpenMore();
      }}
      className="st-t-fast mx-3 mt-2 flex h-9 shrink-0 items-center justify-between border-t border-[var(--st-line)] px-1 text-[13px] text-[color:var(--st-t2)] transition-colors hover:text-[color:var(--st-t1)]"
    >
      <span>{label}</span>
      <ChevronRight size={14} />
    </button>
  );
}

/**
 * The picker a panel row opens: the options as pictures, three across and as wide as the panel,
 * with a way on to the full settings. A choice applies at once and the picker stays open.
 */
export function FoliaQuickEffectPicker<Value extends string>({
  anchorRef,
  open,
  onClose,
  value,
  options,
  picture,
  onChange,
  label,
  moreLabel,
  onOpenMore,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  value: Value;
  options: ReadonlyArray<{ value: Value; label: string }>;
  picture: (value: Value, state: FoliaPictureState) => ReactNode;
  onChange: (value: Value) => void;
  label: string;
  moreLabel: string;
  onOpenMore: () => void;
}) {
  return (
    <FoliaPopover
      anchorRef={anchorRef}
      open={open}
      onClose={onClose}
      fill
      aria-label={label}
      className="flex flex-col rounded-[14px] pt-2 pb-1"
    >
      <FoliaPictureGrid
        value={value}
        options={options}
        picture={picture}
        columns={3}
        onChange={onChange}
        label={label}
        maxHeight={300}
      />
      <FoliaPickerMoreButton label={moreLabel} onClose={onClose} onOpenMore={onOpenMore} />
    </FoliaPopover>
  );
}

/** Returns the option `step` places away from `current`, wrapping at both ends. */
export function getSteppedMode<Value>(
  options: readonly Value[],
  current: Value,
  step: -1 | 1,
): Value {
  if (options.length === 0) return current;
  const index = options.indexOf(current);
  return options[((index === -1 ? 0 : index) + step + options.length) % options.length];
}

const hasContent = (node: ReactNode) => node !== null && node !== undefined && node !== false;

export function FoliaModeStepperRow<Value extends string>({
  value,
  options,
  onSelect,
  onStep,
  renderGlyph,
  renderPicture,
  caption,
  stepLabels,
  aside,
  params,
  moreLabel,
  onOpenMore,
  open,
  onOpenChange,
}: {
  value: Value;
  options: ReadonlyArray<{ value: Value; label: string }>;
  onSelect: (value: Value) => void;
  onStep: (direction: -1 | 1) => void;
  /** Draws a mode's glyph, the row's own sign of the chosen mode. */
  renderGlyph: (value: Value) => ReactNode;
  /** Draws a mode's picture in the open picker; the same function each time. */
  renderPicture: (value: Value, state: FoliaPictureState) => ReactNode;
  /** The small line over the mode's name, and the row's accessible name. */
  caption: string;
  /** Accessible names of the previous / next arrows. */
  stepLabels: { previous: string; next: string };
  /** One parameter right of the button, before the next arrow (e.g. animation intensity). */
  aside?: ReactNode;
  /** The mode's other parameters, on the line under the button; the line folds away without any. */
  params?: ReactNode;
  moreLabel: string;
  onOpenMore: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const canStep = options.length > 1;
  const reduced = useKitReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  // 0: not an arrow (a pick from the pictures or an outside change) — fade in without sliding.
  const [stepDirection, setStepDirection] = useState<-1 | 0 | 1>(0);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;
  const enterOffset = reduced ? 0 : stepDirection * STEP_ENTER_OFFSET_PX;

  const renderStepButton = (direction: -1 | 1) => (
    <motion.button
      type="button"
      onClick={() => {
        setStepDirection(direction);
        onStep(direction);
      }}
      disabled={!canStep}
      whileTap={canStep && !reduced ? { scale: 0.82, x: direction * 2 } : undefined}
      transition={kitTransition("fast", reduced)}
      className="st-t-fast flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[color:var(--st-t3)] transition-colors hover:bg-[var(--st-fill)] hover:text-[color:var(--st-t1)] disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={direction === -1 ? stepLabels.previous : stepLabels.next}
    >
      {direction === -1 ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
    </motion.button>
  );

  return (
    <div className="py-1">
      <div className="flex items-center gap-1">
        {renderStepButton(-1)}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => onOpenChange(!open)}
          className={`st-t-fast st-focus-inside flex h-12 min-w-0 flex-1 items-center rounded-[10px] pr-2 pl-1.5 text-left transition-colors hover:bg-[var(--st-fill)] ${open ? "bg-[var(--st-fill)]" : ""}`}
          aria-label={caption}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <motion.span
            key={value}
            initial={{ opacity: 0, x: enterOffset }}
            animate={{ opacity: 1, x: 0 }}
            transition={kitTransition("move", reduced)}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <span className="grid h-[30px] w-12 shrink-0 place-items-center rounded-md bg-[var(--st-fill)] text-[color:var(--st-t2)] shadow-[inset_0_0_0_1px_var(--st-line)]">
              {renderGlyph(value)}
            </span>
            <span className="min-w-0">
              <span className="block text-[11.5px] leading-[15px] text-[color:var(--st-t3)]">
                {caption}
              </span>
              <span className="flex min-w-0 items-center gap-1">
                <span className="truncate text-sm leading-[19px]">{selectedLabel}</span>
                <ChevronDown
                  size={13}
                  className={`st-t-move shrink-0 text-[color:var(--st-t3)] transition-transform ${open ? "rotate-180" : ""}`}
                />
              </span>
            </span>
          </motion.span>
        </button>

        {hasContent(aside) ? (
          <motion.div
            key={`${value}-aside`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={kitTransition("move", reduced)}
            className="flex shrink-0 items-center"
          >
            {aside}
          </motion.div>
        ) : null}

        {renderStepButton(1)}
      </div>

      {/* Clipped only while folding, so a raised chip's shadow shows once it has settled. */}
      <AnimatePresence initial={false}>
        {hasContent(params) ? (
          <motion.div
            key="params"
            initial={{ height: 0, opacity: 0, overflow: "hidden" }}
            animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={kitTransition("move", reduced)}
          >
            <motion.div
              key={value}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={kitTransition("move", reduced)}
              className="flex min-h-7 flex-wrap items-center justify-end gap-1.5 pt-1"
            >
              {params}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <FoliaQuickEffectPicker<Value>
        anchorRef={triggerRef}
        open={open}
        onClose={() => onOpenChange(false)}
        value={value}
        options={options}
        picture={renderPicture}
        onChange={(next) => {
          setStepDirection(0);
          onSelect(next);
        }}
        label={caption}
        moreLabel={moreLabel}
        onOpenMore={onOpenMore}
      />
    </div>
  );
}
