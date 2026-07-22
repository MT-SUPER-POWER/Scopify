import type { Line } from "@/components/lyrics/folia/src/types";

const PREVIEW_LINE_DURATION_SECONDS = 4;

function createPreviewLine(id: string, text: string, translation: string, startTime: number): Line {
  const words = text.split(" ");
  const wordDuration = PREVIEW_LINE_DURATION_SECONDS / words.length;

  return {
    endTime: startTime + PREVIEW_LINE_DURATION_SECONDS,
    fullText: text,
    id,
    startTime,
    translation,
    words: words.map((word, index) => ({
      endTime: startTime + (index + 1) * wordDuration,
      startTime: startTime + index * wordDuration,
      text: word,
    })),
  };
}

export const FOLIA_SETTINGS_PREVIEW_LINES = [
  createPreviewLine("preview-1", "Color finds a quiet rhythm", "色彩寻得静谧节奏", 0),
  createPreviewLine("preview-2", "Every shade becomes a signal", "每种色调化作讯号", 4),
  createPreviewLine("preview-3", "Let the room move with the sound", "让空间随声音流动", 8),
  createPreviewLine("preview-4", "The preview is always ready", "预览始终准备就绪", 12),
] satisfies Line[];

export const FOLIA_SETTINGS_PREVIEW_CONTENT = {
  album: "Scopify Visual Settings",
  artist: "Preview Ensemble",
  coverUrl: `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#0f172a"/>
          <stop offset="0.52" stop-color="#4338ca"/>
          <stop offset="1" stop-color="#f472b6"/>
        </linearGradient>
      </defs>
      <rect width="480" height="480" fill="url(#g)"/>
      <circle cx="240" cy="240" r="154" fill="#09090b" fill-opacity=".68"/>
      <circle cx="240" cy="240" r="114" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>
      <circle cx="240" cy="240" r="78" fill="#f8fafc" fill-opacity=".9"/>
      <circle cx="240" cy="240" r="20" fill="#0f172a"/>
      <path d="M104 348 376 132" stroke="#fff" stroke-opacity=".25" stroke-width="9"/>
    </svg>
  `)}`,
  seed: "scopify-settings-preview",
  title: "A Study in Color",
} as const;

export const FOLIA_SETTINGS_PREVIEW_DURATION_SECONDS = 16;
