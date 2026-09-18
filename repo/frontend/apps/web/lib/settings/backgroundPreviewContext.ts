"use client";

import { createContext } from "react";
import type { SavedBackgroundTheme } from "@/types/appearance";

export const BackgroundPreviewContext = createContext<SavedBackgroundTheme | null>(null);
