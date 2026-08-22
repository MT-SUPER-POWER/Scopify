import type { Line } from "@folia/types";

import { LANDING_SONNET_COPY, LANDING_SONNET_LOOP_DURATION } from "@/constants/marketing";

const buildWords = (text: string, startTime: number, endTime: number) => {
  const graphemes = Array.from(text);
  const duration = (endTime - startTime) / Math.max(1, graphemes.length);
  return graphemes.map((grapheme, index) => ({
    text: grapheme,
    startTime: startTime + duration * index,
    endTime: startTime + duration * (index + 1),
  }));
};

export const LANDING_SONNET_LINES: Line[] = LANDING_SONNET_COPY.map(
  ({ text, start, end }, index) => ({
    id: `landing-sonnet-line-${index}`,
    fullText: text,
    startTime: start,
    endTime: end,
    words: buildWords(text, start, end),
    blockIndex: index,
    songPart: "verse",
    isChorus: false,
  }),
);

export const resolveLoopTime = (elapsedTime: number) =>
  ((elapsedTime % LANDING_SONNET_LOOP_DURATION) + LANDING_SONNET_LOOP_DURATION) %
  LANDING_SONNET_LOOP_DURATION;

export const resolveCurrentLineIndex = (time: number) => {
  const index = LANDING_SONNET_LINES.findIndex(
    (line) => time >= line.startTime && time < line.endTime,
  );
  return index >= 0 ? index : 0;
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
