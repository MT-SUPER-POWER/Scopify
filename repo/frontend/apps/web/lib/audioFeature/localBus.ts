import type { LyricAudioBands } from "@/types/lyrics";

const frameListeners = new Set<(bands: LyricAudioBands) => void>();
const demandListeners = new Set<(active: boolean) => void>();

function notifyDemandChanged() {
  const active = frameListeners.size > 0;
  demandListeners.forEach((listener) => listener(active));
}

export function publishLocalAudioFeatures(bands: LyricAudioBands) {
  frameListeners.forEach((listener) => listener(bands));
}

export function subscribeLocalAudioFeatureDemand(listener: (active: boolean) => void) {
  demandListeners.add(listener);
  listener(frameListeners.size > 0);
  return () => demandListeners.delete(listener);
}

export function subscribeLocalAudioFeatures(listener: (bands: LyricAudioBands) => void) {
  const wasInactive = frameListeners.size === 0;
  frameListeners.add(listener);
  if (wasInactive) notifyDemandChanged();

  return () => {
    const removed = frameListeners.delete(listener);
    if (removed && frameListeners.size === 0) notifyDemandChanged();
  };
}
