"use client";

import { createContext, use } from "react";
import type { MvPageContextValue } from "@/types/mv/pageContext";

export const MvPageContext = createContext<MvPageContextValue | null>(null);

export function useMvPage() {
  const value = use(MvPageContext);
  if (!value) throw new Error("useMvPage must be used within MvPageProvider");
  return value;
}
