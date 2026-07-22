"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { FoliaQuickEffectPickerProps } from "@/types/components/lyrics";

/** Compact selector adapted from Folia's player-panel visual controls. */
export function FoliaQuickEffectPicker<Value extends string>({
  ariaLabel,
  isDaylight,
  onChange,
  options,
  primaryColor,
  value,
}: FoliaQuickEffectPickerProps<Value>) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [isOpen]);

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
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

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: -12, y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: 0, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.97, x: -8, y: "-50%" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute top-1/2 right-0 z-20 w-[7.25rem] overflow-hidden rounded-[1.15rem] border shadow-2xl ${
              isDaylight ? "border-black/[0.08] text-black" : "border-white/[0.08] text-white"
            }`}
            style={{
              backgroundColor: isDaylight ? "rgba(255, 255, 255, 0.96)" : "rgba(0, 0, 0, 0.94)",
              boxShadow: isDaylight
                ? "0 18px 44px rgba(15, 23, 42, 0.14)"
                : "0 22px 60px rgba(0, 0, 0, 0.42)",
            }}
          >
            <div
              className="max-h-[11.25rem] overflow-y-auto p-1.5"
              style={{
                ["--scrollbar-thumb-color" as string]: isDaylight
                  ? "rgba(0, 0, 0, 0.16)"
                  : "rgba(255, 255, 255, 0.22)",
                ["--scrollbar-thumb-hover-color" as string]: isDaylight
                  ? "rgba(0, 0, 0, 0.28)"
                  : "rgba(255, 255, 255, 0.35)",
              }}
              role="listbox"
              aria-label={ariaLabel}
            >
              <div className="space-y-0.5">
                {options.map((option) => {
                  const isActive = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`relative flex w-full items-center justify-center rounded-[0.85rem] px-2 text-center transition-all ${
                        isActive
                          ? "py-1.5"
                          : `py-2.5 ${isDaylight ? "hover:bg-black/[0.04]" : "hover:bg-white/[0.04]"}`
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: isDaylight
                                ? "rgba(0, 0, 0, 0.06)"
                                : "rgba(255, 255, 255, 0.12)",
                              color: primaryColor,
                            }
                          : undefined
                      }
                      role="option"
                      aria-selected={isActive}
                    >
                      {isActive ? (
                        <span
                          className="absolute left-2 size-1.5 rounded-full"
                          style={{
                            backgroundColor: isDaylight
                              ? "rgba(0, 0, 0, 0.28)"
                              : "rgba(255, 255, 255, 0.88)",
                            boxShadow: isDaylight
                              ? "0 0 0 1px rgba(255, 255, 255, 0.55)"
                              : "0 0 0 1px rgba(255, 255, 255, 0.18)",
                          }}
                        />
                      ) : null}
                      <span
                        className={`text-[9px] tracking-[0.01em] ${
                          isActive ? "font-medium" : "font-normal"
                        } ${isDaylight ? "text-black/82" : "text-white/84"}`}
                        style={{ color: primaryColor }}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
