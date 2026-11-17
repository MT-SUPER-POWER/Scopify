import { createStore, get, set, update } from "idb-keyval";

import { getLyricSegmentationLineKey, isValidLyricSegmentation } from "@/lib/lyrics/segmentation";
import type {
  LyricSegmentationEdit,
  LyricSegmentationOverrides,
} from "@/types/lyrics/segmentation";

const segmentationStore = createStore("scopify-lyric-segmentation", "segmentation");
const automaticKey = "automatic";

const trackKey = (trackId: string) => `track:${trackId}`;

export async function loadAutomaticLyricSegmentation(): Promise<boolean> {
  return (await get(automaticKey, segmentationStore)) === true;
}

export function saveAutomaticLyricSegmentation(enabled: boolean): Promise<void> {
  return set(automaticKey, enabled, segmentationStore);
}

export async function loadLyricSegmentationOverrides(
  trackId: string,
): Promise<LyricSegmentationOverrides> {
  return (await get<LyricSegmentationOverrides>(trackKey(trackId), segmentationStore)) ?? {};
}

export async function saveLyricSegmentationOverride({
  trackId,
  line,
  boundaries,
}: LyricSegmentationEdit): Promise<LyricSegmentationOverrides> {
  if (boundaries && !isValidLyricSegmentation(line.text, boundaries)) {
    throw new Error("Invalid word boundaries");
  }

  const lineKey = getLyricSegmentationLineKey(line);
  let saved: LyricSegmentationOverrides = {};
  await update<LyricSegmentationOverrides>(
    trackKey(trackId),
    (previous) => {
      saved = { ...previous };
      if (boundaries) saved[lineKey] = boundaries;
      else delete saved[lineKey];
      return saved;
    },
    segmentationStore,
  );
  return saved;
}
