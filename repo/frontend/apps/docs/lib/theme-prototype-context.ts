"use client";

import { createContext } from "react";

import type { ThemePrototypeContextValue } from "@/types/theme-lab";

export const ThemePrototypeContext = createContext<ThemePrototypeContextValue | undefined>(
  undefined,
);
