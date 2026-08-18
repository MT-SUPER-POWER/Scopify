"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FoliaQuickEffectPickerMenu } from "@/components/lyrics/FoliaQuickEffectPickerMenu";
import { getFoliaQuickEffectPickerPosition } from "@/lib/lyrics/foliaQuickEffectPicker";
import type { FoliaQuickEffectPickerProps } from "@/types/components/lyrics";

/** Compact selector adapted from Folia's player-panel visual controls. */
export function FoliaQuickEffectPicker<Value extends string>({
  ariaLabel,
  isDaylight,
  moreActionLabel,
  onChange,
  onMoreAction,
  options,
  primaryColor,
  value,
}: FoliaQuickEffectPickerProps<Value>) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    left: 0,
    maxHeight: 180,
    opensUpward: false,
    top: 0,
    width: 116,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const updateMenuPosition = useCallback(() => {
    const triggerRect = pickerRef.current?.getBoundingClientRect();
    if (!triggerRect) return;
    setMenuPosition(
      getFoliaQuickEffectPickerPosition(
        triggerRect,
        options.length,
        window.innerWidth,
        window.innerHeight,
      ),
    );
  }, [options.length]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !pickerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    updateMenuPosition();
    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!isOpen) updateMenuPosition();
          setIsOpen((open) => !open);
        }}
        className={`rounded-lg px-3 py-1 text-[10px] font-bold transition-all ${
          isDaylight
            ? "bg-white shadow-sm hover:bg-white/90"
            : "bg-white/20 shadow-sm hover:bg-white/30"
        }`}
        style={{ color: primaryColor }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedOption?.label ?? value}
      </button>
      {typeof document === "undefined"
        ? null
        : createPortal(
            <FoliaQuickEffectPickerMenu
              ariaLabel={ariaLabel}
              isDaylight={isDaylight}
              isOpen={isOpen}
              menuPosition={menuPosition}
              menuRef={menuRef}
              moreActionLabel={moreActionLabel}
              onChange={onChange}
              onClose={() => setIsOpen(false)}
              onMoreAction={onMoreAction}
              options={options}
              primaryColor={primaryColor}
              value={value}
            />,
            document.body,
          )}
    </div>
  );
}
