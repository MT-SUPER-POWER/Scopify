"use client";

import { FoliaModeParameters } from "@scopify/ui/scopify/components/folia-panel/mode-parameters";
import { motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import type { FoliaModeStepperRowProps } from "@scopify/ui/scopify/components/folia-panel/mode-row-types";

import {
  kitTransition,
  useKitReducedMotion,
} from "@scopify/ui/scopify/components/folia-panel/motion";
// Folia's player-panel mode rows (panelTab/controls/ModeStepperRow.tsx, panelTab/QuickEffectPicker.tsx):
// Names, mode navigation and intensity stay on the main row. A separate parameter popover
// keeps every shortcut reachable without shrinking the mode name. The middle opens the style grid.

const STEP_ENTER_OFFSET_PX = 10;

export {
  FoliaPickerMoreButton,
  getSteppedMode,
} from "@scopify/ui/scopify/components/folia-panel/mode-picker";
import { FoliaQuickEffectPicker } from "@scopify/ui/scopify/components/folia-panel/mode-picker";

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
  inlineParams = false,
  moreLabel,
  onOpenMore,
  open,
  onOpenChange,
}: FoliaModeStepperRowProps<Value>) {
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
          title={`${caption}: ${selectedLabel}`}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <motion.span
            key={value}
            initial={{ opacity: 0, x: enterOffset }}
            animate={{ opacity: 1, x: 0 }}
            transition={kitTransition("move", reduced)}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <span className="grid h-[30px] w-9 shrink-0 place-items-center rounded-md bg-[var(--st-fill)] text-[color:var(--st-t2)] shadow-[inset_0_0_0_1px_var(--st-line)]">
              {renderGlyph(value)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11.5px] leading-[15px] text-[color:var(--st-t3)]">
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

        {hasContent(aside) ? <div className="shrink-0">{aside}</div> : null}
        {hasContent(params) ? (
          inlineParams ? (
            <div className="flex shrink-0 items-center gap-1">{params}</div>
          ) : (
            <FoliaModeParameters
              key={value}
              title={`${caption} · ${selectedLabel}`}
              label={`${selectedLabel} · ${moreLabel}`}
              onOpen={() => onOpenChange(false)}
            >
              {params}
            </FoliaModeParameters>
          )
        ) : null}
        {renderStepButton(1)}
      </div>

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
