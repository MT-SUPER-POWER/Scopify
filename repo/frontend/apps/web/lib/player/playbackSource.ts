const DEFAULT_SOURCE_READY_TIMEOUT_MS = 12_000;

function normalizeSourceUrl(audio: HTMLAudioElement, value: string): string | null {
  try {
    return new URL(value, audio.ownerDocument?.baseURI ?? globalThis.location?.href).href;
  } catch {
    return null;
  }
}

/** Confirms that the media element is loading the URL owned by the active load revision. */
export function isPlaybackSourceCurrent(audio: HTMLAudioElement, sourceUrl: string): boolean {
  const expectedUrl = normalizeSourceUrl(audio, sourceUrl);
  if (!expectedUrl) return false;

  const currentUrl = audio.currentSrc ? normalizeSourceUrl(audio, audio.currentSrc) : null;
  const declaredSource = audio.getAttribute("src");
  const declaredUrl = declaredSource ? normalizeSourceUrl(audio, declaredSource) : null;
  return currentUrl ? currentUrl === expectedUrl : declaredUrl === expectedUrl;
}

/** Waits for source assignment/metadata without letting an obsolete command play a newer track. */
export function waitForPlaybackSource(
  audio: HTMLAudioElement,
  sourceUrl: string,
  isCurrent: () => boolean,
  timeoutMs = DEFAULT_SOURCE_READY_TIMEOUT_MS,
): Promise<boolean> {
  const isReady = () =>
    isCurrent() && isPlaybackSourceCurrent(audio, sourceUrl) && audio.readyState >= 2;
  if (isReady()) return Promise.resolve(true);
  if (!isCurrent()) return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      for (const event of events) audio.removeEventListener(event, inspect);
      resolve(ready);
    };
    const inspect = () => {
      if (!isCurrent()) {
        finish(false);
        return;
      }
      if (isReady()) finish(true);
      else if (isPlaybackSourceCurrent(audio, sourceUrl) && audio.error) finish(false);
    };
    const events: ReadonlyArray<keyof HTMLMediaElementEventMap> = [
      "abort",
      "canplay",
      "emptied",
      "error",
      "loadedmetadata",
      "loadstart",
    ];
    const timeout = setTimeout(() => finish(false), timeoutMs);
    for (const event of events) audio.addEventListener(event, inspect);
    inspect();
  });
}
