"use client";

import { createContext } from "react";
import type { BackgroundTheme } from "@/types/appearance";

export const BackgroundPreviewContext = createContext<BackgroundTheme | null>(null);
