import type { Line } from "../../types";

// src/utils/lyrics/interlude.ts
// Upstream keeps these two in utils/lyrics/parserCore.ts next to the whole lyric parser; Scopify
// adapts lyrics elsewhere (lib/lyrics/foliaLyricAdapter.ts), so only the interlude test lives here.
export const INTERLUDE_FULL_TEXT = "......";

export const isInterludeLine = (line: Pick<Line, "fullText">): boolean =>
  line.fullText === INTERLUDE_FULL_TEXT;
