import { Shuffle } from "lucide-react";
import {
  FoliaBackgroundModeGlyph,
  FoliaVisualizerModeGlyph,
} from "@/components/lyrics/FoliaModeGlyph";
import type { VisualizerBackgroundMode } from "@/components/lyrics/folia/src/types";

const RANDOM_CHOICE = "__random__";

export const drawStyleGlyph = (mode: string) =>
  mode === RANDOM_CHOICE ? (
    <Shuffle size={18} />
  ) : (
    <FoliaVisualizerModeGlyph mode={mode} size={18} />
  );

export const drawStylePicture = (mode: string) => (
  <span
    className={`grid size-full place-items-center ${mode === RANDOM_CHOICE ? "text-[color:var(--st-accent)]" : "text-[color:var(--st-t2)]"}`}
  >
    {mode === RANDOM_CHOICE ? (
      <Shuffle size={28} />
    ) : (
      <FoliaVisualizerModeGlyph mode={mode} size={30} />
    )}
  </span>
);

export const drawPoolPicture = (mode: string) => (
  <span className="grid size-full place-items-center text-[color:var(--st-t2)]">
    <FoliaVisualizerModeGlyph mode={mode} size={22} />
  </span>
);

export const drawBackgroundGlyph = (mode: VisualizerBackgroundMode) => (
  <FoliaBackgroundModeGlyph mode={mode} size={18} />
);

export const drawBackgroundPicture = (mode: VisualizerBackgroundMode) => (
  <span className="grid size-full place-items-center text-[color:var(--st-t2)]">
    <FoliaBackgroundModeGlyph mode={mode} size={30} />
  </span>
);
