"use client";

import { useEffect } from "react";
import type { UseCommandWorkspaceNavigationOptions } from "@/types/commandWorkspace";

export function useCommandWorkspaceNavigation({
  onBack,
  onRoot,
  onToggleHelp,
}: UseCommandWorkspaceNavigationOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onBack();
        return;
      }
      if (event.ctrlKey && event.key === "Home") {
        event.preventDefault();
        onRoot();
        return;
      }
      if (event.key === "?" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        onToggleHelp();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack, onRoot, onToggleHelp]);
}
