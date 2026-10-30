import type { ReactNode } from "react";

import type { VisualizerBackgroundMode, VisualizerMode } from "@/components/lyrics/folia/src/types";

// Folia's panel glyphs (visualizer/modeGlyphs.tsx and each mode's entry.tsx `glyph`): minimal line
// sketches of each mode's layout, not previews. Scopify's own archive and rhine modes follow the
// same style; a mode with no glyph falls back to the generic one.

const GLYPH_FRAME = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const FALLBACK_GLYPH = (
  <>
    <path d="M5 8h14" />
    <path d="M5 12h9" opacity="0.5" />
    <path d="M5 16h12" opacity="0.5" />
  </>
);

const VISUALIZER_GLYPHS: Record<string, ReactNode> = {
  archive: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" opacity="0.55" />
      <path d="M7 10h7" />
      <path d="M7 14h10" opacity="0.55" />
    </>
  ),
  cadenza: (
    <>
      <circle cx="9.5" cy="12.5" r="3.5" />
      <path d="M4 6.5h3.5" opacity="0.45" />
      <path d="M16 8h4" opacity="0.45" />
      <path d="M15 17h4.5" opacity="0.45" />
    </>
  ),
  cappella: (
    <>
      <rect x="3" y="5" width="12" height="6" rx="3" />
      <rect x="9" y="13.5" width="12" height="6" rx="3" opacity="0.5" />
    </>
  ),
  claddagh: (
    <>
      <ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-18 12 12)" />
      <circle cx="18" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  classic: (
    <>
      <path d="M3 12h18" opacity="0.35" />
      <path d="M3 12h8" />
    </>
  ),
  diorama: (
    <>
      <rect x="3.5" y="12" width="5" height="5" rx="1" opacity="0.45" />
      <rect x="9.5" y="6" width="6.5" height="6.5" rx="1" />
      <rect x="17" y="13.5" width="4" height="4" rx="1" opacity="0.45" />
    </>
  ),
  fume: (
    <>
      <path d="M6 7.5h9" opacity="0.3" />
      <path d="M1 12h22" />
      <path d="M9 16.5h9" opacity="0.3" />
    </>
  ),
  // 花火：一道升空尾迹，顶上开一朵花（Folia hanabi/entry.tsx 的 glyph）
  hanabi: (
    <>
      <path d="M12 21v-8" opacity="0.5" />
      <path d="M12 9V4M12 9l3.5-3.5M12 9l-3.5-3.5M12 9h5M12 9H7M12 9l3.5 3.5M12 9l-3.5 3.5" />
    </>
  ),
  // 町景：一间小店，屋顶一块牌子，斜斜的雨（Folia machi/entry.tsx 的 glyph）
  machi: (
    <>
      <path d="M4 20V11h11v9" />
      <path d="M6.5 11V8.5h6V11" opacity="0.6" />
      <path d="M9 20v-4.5h3V20" opacity="0.6" />
      <path d="M18 4l-1.2 3M21 6l-1.2 3M18.5 11l-1.2 3" opacity="0.5" />
    </>
  ),
  monet: (
    <>
      <path d="M3 9.5h7" />
      <path d="M3 13.5h5" opacity="0.55" />
      <rect x="14" y="5" width="7" height="14" rx="1.5" opacity="0.55" />
    </>
  ),
  // 雾笺：一扇窗，雾上手指写的一笔，几颗水珠（Folia nebbia/entry.tsx 的 glyph）
  nebbia: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M7 14c2-3.5 4-3.5 5 0s3 3 5-1" opacity="0.6" />
      <path d="M8 8v1.5M15.5 7.5v2" opacity="0.5" />
    </>
  ),
  partita: (
    <>
      <path d="M4 7h7" />
      <path d="M8.5 12h7" opacity="0.7" />
      <path d="M13 17h7" opacity="0.45" />
    </>
  ),
  pendolo: (
    <>
      <circle cx="8" cy="12" r="5" />
      <circle cx="8" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M16 10h5" opacity="0.55" />
      <path d="M16 14h4" opacity="0.55" />
    </>
  ),
  sonnet: (
    <>
      <path d="M4 7V4.5h2.5M17.5 4.5H20V7M20 17v2.5h-2.5M6.5 19.5H4V17" />
      <path d="M8.5 12h7" opacity="0.6" />
    </>
  ),
  still: (
    <>
      <path d="M5 7.5h14" opacity="0.35" />
      <path d="M3 12h18" />
      <path d="M6 16.5h12" opacity="0.35" />
    </>
  ),
  tempera: (
    <>
      <rect x="4" y="4" width="16" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="16" height="6.5" rx="1" opacity="0.45" />
      <path d="M4 12h16" opacity="0.7" />
    </>
  ),
  tilt: (
    <>
      <path d="M4 9h16" />
      <path d="M5 16.5l14-3" opacity="0.55" />
    </>
  ),
};

const BACKGROUND_GLYPHS: Record<string, ReactNode> = {
  common: (
    <>
      <path d="M4 17l5-8 5 8z" />
      <circle cx="17.5" cy="8.5" r="3" opacity="0.55" />
    </>
  ),
  latent: (
    <>
      <path d="M4.5 7.5h.01M9 7.5h.01M13.5 7.5h.01M18 7.5h.01" strokeWidth="2.2" opacity="0.55" />
      <path d="M3 15c3-3.5 6-3.5 9 0s6 3.5 9 0" />
    </>
  ),
  monet: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M20.5 8.5L8 19.5" opacity="0.55" />
    </>
  ),
  nomand: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="0.8" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="0.8" opacity="0.45" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="0.8" opacity="0.45" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="0.8" />
    </>
  ),
  rhine: (
    <>
      <path d="M4 9l6-4M4 14l11-8M6 19l14-10" opacity="0.55" />
      <path d="M11 19l9-6" />
    </>
  ),
  sora: (
    <>
      <path d="M12 5.5l1.2 2.9 2.9 1.2-2.9 1.2L12 13.7l-1.2-2.9-2.9-1.2 2.9-1.2z" />
      <path d="M5.5 16.5h.01M18 15.5h.01M7 7h.01" strokeWidth="2.2" opacity="0.5" />
    </>
  ),
  url: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M3.5 9.5h17" opacity="0.55" />
    </>
  ),
};

export function FoliaVisualizerModeGlyph({
  mode,
  size = 14,
}: {
  mode: VisualizerMode;
  size?: number;
}) {
  return (
    <svg width={size} height={size} {...GLYPH_FRAME} aria-hidden="true" focusable="false">
      {VISUALIZER_GLYPHS[mode] ?? FALLBACK_GLYPH}
    </svg>
  );
}

export function FoliaBackgroundModeGlyph({
  mode,
  size = 14,
}: {
  mode: VisualizerBackgroundMode;
  size?: number;
}) {
  return (
    <svg width={size} height={size} {...GLYPH_FRAME} aria-hidden="true" focusable="false">
      {BACKGROUND_GLYPHS[mode] ?? FALLBACK_GLYPH}
    </svg>
  );
}
