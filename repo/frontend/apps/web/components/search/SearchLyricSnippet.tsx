"use client";

import { cn } from "@/lib/utils";
import type { HighlightedLyricTextProps, SearchLyricSnippetProps } from "@/types/components/search";

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({ highlight, text }: HighlightedLyricTextProps) {
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }

  const query = highlight.trim();
  const escaped = escapeRegExp(query);
  const pattern = new RegExp(`(${escaped})`, "gi");
  const checkPattern = new RegExp(`^${escaped}$`, "i");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        checkPattern.test(part) ? (
          <mark key={index} className="bg-transparent font-semibold text-brand">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function SearchLyricSnippet({
  item,
  highlightKeyword,
  full = false,
}: SearchLyricSnippetProps) {
  const highlight = (item.highlightText || highlightKeyword)?.trim();
  const lines = (full ? item.lyric || item.matchedLyric : item.matchedLyric || item.lyric)
    .split("\n")
    .filter((line) => line.trim());

  return (
    <div
      className={cn(
        "min-w-0 space-y-2 text-content-muted",
        full ? "text-base leading-9 select-text" : "w-full text-sm leading-7",
      )}
    >
      {(full ? lines : lines.slice(0, 3)).map((line, index) => {
        const isMatch = Boolean(highlight && line.toLowerCase().includes(highlight.toLowerCase()));
        return (
          <p
            key={index}
            className={cn(
              !full && "line-clamp-2 break-words",
              isMatch && "font-medium text-content",
              isMatch && !full && "text-lg leading-8",
            )}
          >
            <HighlightedText text={line} highlight={highlight} />
          </p>
        );
      })}
    </div>
  );
}
