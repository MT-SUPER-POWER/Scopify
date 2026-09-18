import type { SubtitleThemeCardProps } from "@/types/subtitle-preview";
import { ThemeAssetCard } from "./ThemeAssetCard";

export function SubtitleThemeCard({
  theme,
  selected,
  managing = false,
  readOnly = false,
  onSelect,
  onEdit,
}: SubtitleThemeCardProps) {
  const { settings } = theme;
  return (
    <ThemeAssetCard
      name={theme.name}
      selected={selected}
      selectionMode={managing}
      readOnly={readOnly}
      onSelect={onSelect}
      onOpen={onEdit}
      preview={
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-xl font-semibold"
          style={{
            background: `color-mix(in srgb, ${settings.backgroundColor} ${settings.backdropOpacity}%, transparent)`,
          }}
        >
          <span
            style={
              settings.colorMode === "gradient"
                ? {
                    backgroundImage: `linear-gradient(${settings.gradientAngle}deg, ${settings.color}, ${settings.gradientColor})`,
                    backgroundClip: "text",
                    color: "transparent",
                  }
                : { color: settings.color }
            }
          >
            Aa 字
          </span>
        </span>
      }
    />
  );
}
