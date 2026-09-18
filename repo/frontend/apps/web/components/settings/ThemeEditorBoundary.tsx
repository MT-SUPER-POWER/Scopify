"use client";

import { useEffect, useState } from "react";
import type { ThemeEditorBoundaryProps } from "@/types/appearance-theme-editor";

// Drafts must be initialized after the persisted stores have hydrated on the client.
export function ThemeEditorBoundary({ children }: ThemeEditorBoundaryProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? children : null;
}
