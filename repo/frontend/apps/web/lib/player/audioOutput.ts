export const PLAYBACK_AUDIO_SELECTOR = "audio[data-playback-authority]";

type SinkSelectableAudioElement = HTMLAudioElement & {
  setSinkId?: (deviceId: string) => Promise<void>;
};

export function getPlaybackAudioElement() {
  if (typeof document === "undefined") return null;
  return document.querySelector<SinkSelectableAudioElement>(PLAYBACK_AUDIO_SELECTOR);
}

export const isAudioOutputSelectionSupported = () =>
  typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

export async function setAudioElementOutputDevice(
  audio: SinkSelectableAudioElement,
  deviceId: string,
) {
  if (typeof audio.setSinkId !== "function") {
    throw new Error("Audio output selection is not supported in this environment.");
  }
  await audio.setSinkId(deviceId);
}
