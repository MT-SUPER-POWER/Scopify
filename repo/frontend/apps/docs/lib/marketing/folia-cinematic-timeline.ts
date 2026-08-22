import type { Line } from "@folia/types";

import { LANDING_CINEMATIC_COPY } from "@/constants/marketing";
import type { FoliaCinematicMode } from "@/types/marketing";

export const clampProgress = (value: number) => Math.min(1, Math.max(0, value));

export const resolveCinematicMode = (progress: number): FoliaCinematicMode => {
  if (progress < 0.34) return "sonnet";
  if (progress < 0.68) return "diorama";
  return "partita";
};

export const resolveSceneProgress = (progress: number, start: number, end: number) =>
  clampProgress((progress - start) / (end - start));

export const resolveHoldOpacity = (progress: number, start: number, end: number) => {
  const local = resolveSceneProgress(progress, start, end);
  const fadeIn = clampProgress(local / 0.16);
  const fadeOut = clampProgress((1 - local) / 0.18);
  return Math.min(fadeIn, fadeOut);
};

const buildWords = (text: string, startTime: number, endTime: number) => {
  const graphemes = Array.from(text);
  const duration = (endTime - startTime) / Math.max(1, graphemes.length);
  return graphemes.map((grapheme, index) => ({
    text: grapheme,
    startTime: startTime + duration * index,
    endTime: startTime + duration * (index + 1),
  }));
};

export const LANDING_CINEMATIC_LINES: Line[] = LANDING_CINEMATIC_COPY.map(
  ({ text, start, end }, index) => ({
    id: `landing-line-${index}`,
    fullText: text,
    startTime: start,
    endTime: end,
    words: buildWords(text, start, end),
    blockIndex: Math.floor(index / 3),
    songPart: index >= 3 && index <= 5 ? "chorus" : "verse",
    isChorus: index >= 3 && index <= 5,
  }),
);

export const resolveCurrentLineIndex = (time: number) => {
  const index = LANDING_CINEMATIC_LINES.findIndex(
    (line) => time >= line.startTime && time < line.endTime,
  );
  return index >= 0 ? index : LANDING_CINEMATIC_LINES.length - 1;
};

export const resolveVisualBeat = (time: number) => {
  const pulse = (frequency: number, phase = 0) =>
    Math.pow((Math.sin((time * frequency + phase) * Math.PI) + 1) / 2, 3.2);

  return {
    power: 42 + pulse(1.45) * 152,
    bass: 30 + pulse(1.05) * 205,
    lowMid: 38 + pulse(1.45, 0.32) * 172,
    mid: 34 + pulse(1.9, 0.12) * 185,
    vocal: 46 + pulse(1.18, 0.58) * 176,
    treble: 24 + pulse(2.7, 0.41) * 148,
  };
};
