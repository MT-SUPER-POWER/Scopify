"use client";

import { Popover } from "radix-ui";

/** Uses Radix's anchor positioning with the same fill and border as the panel. */
export function PopoverArrow({ width = 16, height = 8 }: { width?: number; height?: number }) {
  return (
    <Popover.Arrow asChild width={width} height={height}>
      <svg
        viewBox="0 0 20 10"
        className="pointer-events-none overflow-visible"
        data-slot="popover-arrow"
        aria-hidden="true"
      >
        <path
          d="M0 0 10 10 20 0"
          className="fill-[var(--popover-arrow-fill,var(--popover))] stroke-[color:var(--popover-arrow-border,var(--border))]"
          strokeLinejoin="round"
        />
        <path
          d="M0 0H20"
          className="stroke-[color:var(--popover-arrow-fill,var(--popover))]"
          strokeWidth={2}
        />
      </svg>
    </Popover.Arrow>
  );
}
