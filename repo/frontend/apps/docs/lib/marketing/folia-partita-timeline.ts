import type { Line } from "@folia/types";

import { LANDING_PARTITA_ANIMATION_DURATION, LANDING_PARTITA_SLOGAN } from "@/constants/marketing";

const WORD_START_OFFSET = 0.35;
const WORD_STEP = 0.38;

export const LANDING_PARTITA_LINES: Line[] = [
  {
    id: "landing-partita-slogan",
    fullText: LANDING_PARTITA_SLOGAN,
    startTime: 0,
    endTime: 30,
    words: Array.from(LANDING_PARTITA_SLOGAN).map((text, index) => ({
      text,
      startTime: WORD_START_OFFSET + WORD_STEP * index,
      endTime: WORD_START_OFFSET + WORD_STEP * (index + 1),
    })),
    blockIndex: 0,
    songPart: "verse",
    isChorus: false,
  },
];

export const resolvePartitaIntroTime = (elapsedTime: number) =>
  Math.min(Math.max(elapsedTime, 0), LANDING_PARTITA_ANIMATION_DURATION);
