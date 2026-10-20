import type { Line } from "@folia/types";

/** 每句歌词唱多久（秒）。 */
export const STAGE_LINE_SECONDS = 3.6;

const buildWords = (text: string, startTime: number, endTime: number) => {
  const graphemes = Array.from(text);
  const duration = (endTime - startTime) / Math.max(1, graphemes.length);
  return graphemes.map((grapheme, index) => ({
    text: grapheme,
    startTime: startTime + duration * index,
    endTime: startTime + duration * (index + 1),
  }));
};

/** 把一场的几句词排成 Folia 的歌词时间轴：一句接一句，逐字均匀点亮。 */
export const buildStageLines = (sceneId: string, verse: readonly string[]): Line[] =>
  verse.map((text, index) => {
    const start = index * STAGE_LINE_SECONDS;
    const end = start + STAGE_LINE_SECONDS;
    return {
      id: `landing-stage-${sceneId}-${index}`,
      fullText: text,
      startTime: start,
      endTime: end,
      words: buildWords(text, start, end),
      blockIndex: index,
      songPart: "verse",
      isChorus: false,
    };
  });

/** 一场唱完一遍的时长。 */
export const resolveLoopDuration = (lines: readonly Line[]) => lines.at(-1)?.endTime ?? 0;

export const resolveLoopTime = (elapsedTime: number, loopDuration: number) =>
  loopDuration > 0 ? ((elapsedTime % loopDuration) + loopDuration) % loopDuration : 0;

export const resolveCurrentLineIndex = (lines: readonly Line[], time: number) => {
  const index = lines.findIndex((line) => time >= line.startTime && time < line.endTime);
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
