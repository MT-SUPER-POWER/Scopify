"use client";

import { createContext } from "react";
import type { BackgroundThemePreview } from "@/types/appearance/model";

export const BackgroundPreviewContext = createContext<BackgroundThemePreview | null>(null);
