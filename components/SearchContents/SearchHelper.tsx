import { cn } from "@/lib/utils";
import Image from "next/image";

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
        seg.highLighted
          ? <span key={i} className="text-white font-semibold">{seg.text}</span>
          : <span key={i} className="text-zinc-400">{seg.text}</span>
      )}
    </>
  );
}

export function SuggestTag({ item }: { item: SuggestItem }) {
  if (item.tagUrl) {
    return <Image width={16} height={16} src={item.tagUrl} alt={item.tag ?? ""} className="h-4 object-contain shrink-0" />;
  }
  if (item.tag) {
    return (
      <span className={cn(
        "text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0",
        item.skinType === "colorPrimary1"
          ? "text-[#1ed760] border border-[#1ed760]/40 bg-[#1ed760]/10"
          : "text-zinc-400 border border-zinc-600"
      )}>
        {item.tag}
      </span>
    );
  }
  return null;
}
