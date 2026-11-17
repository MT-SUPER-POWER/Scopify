import { createContext } from "react";
import type { SubtitleOverlaySettings } from "@/types/lyrics/folia/subtitleTrack";

export const SubtitleOverlaySettingsContext = createContext<SubtitleOverlaySettings | undefined>(
  undefined,
);
