"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import type { FoliaQuickEffectPickerMenuProps } from "@/types/components/lyrics";

export function FoliaQuickEffectPickerMenu<Value extends string>({
  ariaLabel,
  isDaylight,
  isOpen,
  menuPosition,
  menuRef,
  moreActionLabel,
  onChange,
  onClose,
  onMoreAction,
  options,
  primaryColor,
  value,
}: FoliaQuickEffectPickerMenuProps<Value>) {
  return (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.96, y: menuPosition.opensUpward ? 6 : -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: menuPosition.opensUpward ? 4 : -4 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className={`fixed z-160 w-29 overflow-hidden rounded-[1.15rem] border shadow-2xl ${
            isDaylight ? "border-black/8 text-black" : "border-white/8 text-white"
          }`}
          style={{
            backgroundColor: isDaylight ? "rgba(255, 255, 255, 0.96)" : "rgba(0, 0, 0, 0.94)",
            boxShadow: isDaylight
              ? "0 18px 44px rgba(15, 23, 42, 0.14)"
              : "0 22px 60px rgba(0, 0, 0, 0.42)",
            left: menuPosition.left,
            top: menuPosition.top,
            transformOrigin: menuPosition.opensUpward ? "bottom right" : "top right",
            width: menuPosition.width,
          }}
        >
          <div
            className="visualizer-overlay-scrollbar overflow-y-auto p-1.5"
            style={{
              ["--scrollbar-thumb-color" as string]: isDaylight
                ? "rgba(0, 0, 0, 0.16)"
                : "rgba(255, 255, 255, 0.22)",
              ["--scrollbar-thumb-hover-color" as string]: isDaylight
                ? "rgba(0, 0, 0, 0.28)"
                : "rgba(255, 255, 255, 0.35)",
              maxHeight: menuPosition.maxHeight,
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
                      onClose();
                    }}
                    className={`relative flex w-full items-center justify-center rounded-[0.85rem] px-2 text-center transition-all ${
                      isActive
                        ? "py-1.5"
                        : `py-2.5 ${isDaylight ? "hover:bg-black/4" : "hover:bg-white/4"}`
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
            {moreActionLabel && onMoreAction ? (
              <div
                className={`mt-1.5 border-t pt-1.5 ${isDaylight ? "border-black/8" : "border-white/10"}`}
              >
                <button
                  className={`flex w-full items-center justify-between rounded-[0.85rem] px-2.5 py-2 text-[9px] font-medium transition-colors ${
                    isDaylight ? "hover:bg-black/4" : "hover:bg-white/6"
                  }`}
                  onClick={() => {
                    onClose();
                    onMoreAction();
                  }}
                  style={{ color: primaryColor }}
                  type="button"
                >
                  <span>{moreActionLabel}</span>
                  <ChevronRight aria-hidden size={12} />
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
