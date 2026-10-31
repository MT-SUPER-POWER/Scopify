import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Replace, Upload } from "lucide-react";
import type { TranslateFn } from "@/types/i18n/model";
import type { TemperaPoolImportMode } from "@/types/lyrics/folia/temperaImagePool";

// src/components/visualizer/tempera/TemperaImageImportMenu.tsx (Folia acf7ffc9)
// Keeps the two meanings of backup import behind one anchored menu. Replacing a non-empty pool
// asks inside the menu before the file picker opens, instead of Folia's native confirm().

interface TemperaImageImportMenuProps {
  disabled: boolean;
  appendDisabled: boolean;
  /** Images the replace option would clear; zero skips the confirmation step. */
  poolSize: number;
  isDaylight: boolean;
  t: TranslateFn;
  onChoose: (mode: TemperaPoolImportMode) => void;
}

const itemClass =
  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent";

const TemperaImageImportMenu: React.FC<TemperaImageImportMenuProps> = ({
  disabled,
  appendDisabled,
  poolSize,
  isDaylight,
  t,
  onChoose,
}) => {
  const [isMenuRequested, setIsMenuRequested] = useState(false);
  const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // A run starting elsewhere disables the trigger; the menu folds away with it.
  const isOpen = isMenuRequested && !disabled;

  const close = () => {
    setIsMenuRequested(false);
    setIsConfirmingReplace(false);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const dismiss = () => {
      setIsMenuRequested(false);
      setIsConfirmingReplace(false);
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) dismiss();
    };
    // Capture phase: the surrounding Folia dialog listens for Escape on the document too, and
    // the open menu has to consume it first.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [isOpen]);

  const choose = (mode: TemperaPoolImportMode) => {
    if (mode === "replace" && poolSize > 0 && !isConfirmingReplace) {
      setIsConfirmingReplace(true);
      return;
    }
    close();
    onChoose(mode);
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? close() : setIsMenuRequested(true))}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs transition-colors hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent"
        style={{ color: "var(--text-primary)" }}
      >
        <Upload size={14} />
        {t("folia.options.temperaImportImages")}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-30 mb-2 w-60 rounded-2xl border border-white/15 p-1.5 shadow-2xl backdrop-blur-xl"
          style={{
            color: "var(--text-primary)",
            backgroundColor: isDaylight ? "rgba(255,255,255,0.98)" : "rgba(24,24,27,0.98)",
          }}
        >
          {isConfirmingReplace ? (
            <div className="space-y-2 p-2">
              <p className="text-xs leading-relaxed">
                {t("folia.options.temperaImportConfirmReplace", { count: poolSize })}
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={close} className={`${itemClass} w-auto`}>
                  {t("folia.ui.cancel")}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => choose("replace")}
                  className={`${itemClass} w-auto border border-white/20`}
                >
                  {t("folia.options.temperaImportConfirmReplaceAction")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                disabled={appendDisabled}
                onClick={() => choose("append")}
                className={itemClass}
              >
                <Plus size={14} className="shrink-0" />
                {t("folia.options.temperaImportAppendImages")}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => choose("replace")}
                className={itemClass}
              >
                <Replace size={14} className="shrink-0" />
                {t("folia.options.temperaImportReplaceImages")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TemperaImageImportMenu;
