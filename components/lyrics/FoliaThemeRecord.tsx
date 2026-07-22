import { Disc3 } from "lucide-react";

import type { FoliaStageTheme } from "@/types/foliaStage";

interface FoliaThemeRecordProps {
  size?: "compact" | "library";
  theme: FoliaStageTheme;
}

/** A crisp SVG vinyl record that exposes the theme's dark and light color pair. */
export function FoliaThemeRecord({ size = "compact", theme }: FoliaThemeRecordProps) {
  const isLibraryRecord = size === "library";
  const colors = theme.dark;
  const sizeClass = isLibraryRecord ? "size-10" : "size-6";
  const iconSize = isLibraryRecord ? 25 : 15;

  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClass}`}
      style={{
        background: `conic-gradient(from 45deg, ${theme.dark.backgroundColor} 0 50%, ${theme.light.backgroundColor} 50% 100%)`,
        boxShadow: `inset 0 0 0 1px ${colors.primaryColor}38, 0 2px 5px rgba(15, 23, 42, 0.12)`,
      }}
    >
      <Disc3
        size={iconSize}
        strokeWidth={isLibraryRecord ? 1.65 : 1.8}
        style={{
          color: colors.primaryColor,
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.22))",
        }}
      />
      <span
        className={`absolute rounded-full border ${isLibraryRecord ? "size-2.5" : "size-1.5"}`}
        style={{
          background: `conic-gradient(from 45deg, ${theme.dark.accentColor} 0 50%, ${theme.light.accentColor} 50% 100%)`,
          borderColor: `${colors.primaryColor}80`,
        }}
      />
    </span>
  );
}
