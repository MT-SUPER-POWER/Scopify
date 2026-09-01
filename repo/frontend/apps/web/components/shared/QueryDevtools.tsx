"use client";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useRef } from "react";

import { useQueryDevtoolsCornerSnap } from "@/hooks/useQueryDevtoolsCornerSnap";
import type { QueryDevtoolsCorner } from "@/types/components/queryDevtools";

function getPanelPosition(corner: QueryDevtoolsCorner) {
  return corner.startsWith("top") ? "top" : "bottom";
}

/** Development-only native TanStack Query Devtools with four-corner button snapping. */
export function QueryDevtools() {
  const containerRef = useRef<HTMLDivElement>(null);
  const corner = useQueryDevtoolsCornerSnap(containerRef);

  return (
    <div ref={containerRef}>
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition={corner}
        position={getPanelPosition(corner)}
      />
    </div>
  );
}
