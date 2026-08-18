import Image from "next/image";
import { cn } from "@/lib/utils";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TYPES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface HighLightSegment {
  text: string;
  highLighted: boolean;
}

export interface SuggestItem {
  keyword: string;
  highLightInfo: string;
  iconUrl?: string;
  tag: string | null;
  tagUrl: string | null;
  skinType: string | null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function HighlightText({ raw }: { raw: string }) {
  let segments: HighLightSegment[] = [];
  try {
    segments = JSON.parse(raw);
  } catch {
    return <span>{raw}</span>;
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.highLighted ? (
          <span key={i} className="font-semibold text-content">
            {seg.text}
          </span>
        ) : (
          <span key={i} className="text-content-muted">
            {seg.text}
          </span>
        ),
      )}
    </>
  );
}

export function SuggestTag({ item }: { item: SuggestItem }) {
  if (item.tagUrl) {
    return (
      <Image
        width={16}
        height={16}
        src={item.tagUrl}
        alt={item.tag ?? ""}
        className="h-4 shrink-0 object-contain"
      />
    );
  }
  if (item.tag) {
    return (
      <span
        className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-[11px]",
          item.skinType === "colorPrimary1"
            ? "border border-brand/40 bg-brand/10 text-brand"
            : "border border-content-subtle text-content-muted",
        )}
      >
        {item.tag}
      </span>
    );
  }
  return null;
}
