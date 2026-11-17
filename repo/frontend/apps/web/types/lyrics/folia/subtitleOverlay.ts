import type { Line, SubtitleContentMode, Theme } from "@/components/lyrics/folia/src/types";
import type { SubtitleOverlayLayout } from "@/types/lyrics/folia/subtitleTrack";

export interface VisualizerSubtitleOverlayProps {
  showText: boolean;
  activeLine: Line | null;
  recentCompletedLine: Line | null;
  nextLines: Line[];
  theme: Theme;
  subtitleTheme?: Theme;
  translationFontSize: string;
  upcomingFontSize: string;
  subtitleFontScale?: number;
  opacity?: number;
  subtitleOverlayOpacity?: number;
  subtitleOverlayBackground?: boolean;
  isPlayerChromeHidden?: boolean;
  hideTranslationSubtitle?: boolean;
  showSubtitleTranslation?: boolean;
  subtitleContentMode?: SubtitleContentMode;
  subtitleOverlayLayout?: SubtitleOverlayLayout;
}
