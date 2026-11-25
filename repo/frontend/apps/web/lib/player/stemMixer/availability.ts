export function hasStemMixerPlatform() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    Boolean(navigator.gpu) &&
    typeof Worker !== "undefined" &&
    typeof AudioWorkletNode !== "undefined" &&
    Boolean(window.AudioContext && "audioWorklet" in AudioContext.prototype)
  );
}
