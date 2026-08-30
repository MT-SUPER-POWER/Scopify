"use client";

import { useEffect } from "react";
import type { CommandWorkspacePage } from "@/types/commandWorkspace";

interface UseCommandWorkspaceNavigationOptions {
  onBack(): void;
  onRoot(): void;
  onToggleHelp(): void;
  page: CommandWorkspacePage;
}

export function useCommandWorkspaceNavigation({
  onBack,
  onRoot,
  onToggleHelp,
  page,
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
  }, [onBack, onRoot, onToggleHelp, page]);
}
