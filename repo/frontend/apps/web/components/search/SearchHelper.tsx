import type { MusicSearchHighlight, MusicSearchSuggestionTag } from "@scopify/music-domain/search";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function HighlightText({ highlights }: { highlights: readonly MusicSearchHighlight[] }) {
  return (
    <>
      {highlights.map((segment, i) =>
        segment.matched ? (
          <span key={i} className="font-semibold text-content">
            {segment.text}
          </span>
        ) : (
          <span key={i} className="text-content-muted">
            {segment.text}
          </span>
        ),
      )}
    </>
  );
}

export function SuggestTag({ tag }: { tag: MusicSearchSuggestionTag | null }) {
  if (!tag) return null;
  if (tag.imageUrl) {
    return (
      <Image
        width={16}
        height={16}
        src={tag.imageUrl}
        alt={tag.label ?? ""}
        className="h-4 shrink-0 object-contain"
      />
    );
  }
  if (tag.label) {
    return (
      <span
        className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-[11px]",
          tag.emphasized
            ? "border border-brand/40 bg-brand/10 text-brand"
            : "border border-content-subtle text-content-muted",
        )}
      >
        {tag.label}
      </span>
    );
  }
  return null;
}
