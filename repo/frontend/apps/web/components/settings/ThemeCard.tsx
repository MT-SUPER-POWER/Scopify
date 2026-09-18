import type { ThemeCardProps } from "@/types/appearance";
import { ThemeAssetCard } from "./ThemeAssetCard";

export function ThemeCard({
  theme,
  selected,
  onSelect,
  onEdit,
  onView,
  selectionMode = false,
}: ThemeCardProps) {
  return (
    <ThemeAssetCard
      name={theme.name}
      selected={selected}
      onSelect={onSelect}
      onOpen={onView ?? onEdit}
      readOnly={!!onView}
      selectionMode={selectionMode}
      preview={
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: `linear-gradient(125deg, ${theme.top}, ${theme.bottom})` }}
        >
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/15 to-transparent" />
        </span>
      }
    />
  );
}
