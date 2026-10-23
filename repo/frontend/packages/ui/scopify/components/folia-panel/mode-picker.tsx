"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import {
  FoliaPictureGrid,
  type FoliaPictureState,
} from "@scopify/ui/scopify/components/folia-panel/picture-grid";
import { FoliaPopover } from "@scopify/ui/scopify/components/folia-panel/popover";

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
