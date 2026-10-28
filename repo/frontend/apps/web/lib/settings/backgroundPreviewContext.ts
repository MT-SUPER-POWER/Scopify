"use client";

import { createContext } from "react";
import type { BackgroundTheme } from "@/types/appearance/model";

export const BackgroundPreviewContext = createContext<BackgroundTheme | null>(null);
