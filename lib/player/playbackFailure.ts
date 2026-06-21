export const MAX_AUTO_SKIP_FAILURES = 2;

export type PlaybackFailureAction =
  | { type: "skip"; nextFailureCount: number }
  | { type: "stop"; nextFailureCount: 0 };

export function getPlaybackFailureAction(
  failureCount: number,
  hasNextTrack: boolean,
): PlaybackFailureAction {
  if (hasNextTrack && failureCount < MAX_AUTO_SKIP_FAILURES) {
    return { type: "skip", nextFailureCount: failureCount + 1 };
  }

  return { type: "stop", nextFailureCount: 0 };
}
