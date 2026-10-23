"use client";

import { SlidersHorizontal } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { FoliaPopover } from "@scopify/ui/scopify/components/folia-panel/popover";

/** Keep mode names readable; reveal the complete shortcut toolbar from a dedicated button. */
export function FoliaModeParameters({
  title,
  label,
  children,
  onOpen,
}: {
  title: string;
  label: string;
  children: ReactNode;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) onOpen();
          setOpen(!open);
        }}
        className={`st-t-fast grid size-7 shrink-0 place-items-center rounded-lg text-[color:var(--st-t2)] transition-colors hover:bg-[var(--st-fill2)] ${open ? "bg-[var(--st-fill2)]" : "bg-[var(--st-fill)]"}`}
      >
        <SlidersHorizontal size={15} />
      </button>
      <FoliaPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        fill
        role="dialog"
        aria-label={label}
        className="p-3"
      >
        <div id={titleId} className="mb-3 truncate text-[13px] font-semibold">
          {title}
        </div>
        <div role="group" aria-labelledby={titleId} className="flex flex-wrap items-center gap-2">
          {children}
        </div>
      </FoliaPopover>
    </>
  );
}
