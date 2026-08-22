"use client";

import { useContext } from "react";

import { ThemePrototypeContext } from "@/lib/theme-prototype-context";

export function useThemePrototype() {
  const context = useContext(ThemePrototypeContext);

  if (!context) {
    throw new Error("useThemePrototype must be used inside ThemePrototypeProvider.");
  }

  return context;
}
