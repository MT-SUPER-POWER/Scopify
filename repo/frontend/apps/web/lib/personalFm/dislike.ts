import type { SongDetail } from "@/types/api/music";
import type { PlaybackNextSource } from "@/types/player";

/**
 * The narrow player surface required after NetEase accepts a Personal FM
 * dislike. Keeping it here makes the success-path policy independently
 * testable and prevents each UI entry point from inventing its own queue
 * mutation rules.
 */
export interface PersonalFmDislikePlayer {
  queue: readonly SongDetail[];
  queueIndex: number;
  removeQueueItem(index: number): void;
}

export interface PersonalFmDislikeDependencies {
  advance(source: PlaybackNextSource): Promise<void>;
  getPlayer(): PersonalFmDislikePlayer;
  trash(songId: number): Promise<void>;
}

export type PersonalFmDislikeResult = { status: "advanced" | "removed" | "track-not-in-queue" };

/**
 * Records a "reduce recommendation" signal, then updates the local Personal
 * FM stream only after the server accepts it:
 *
 * - the current track advances through the Personal FM controller, so its
 *   refill policy remains in charge;
 * - another queued track is removed in place and playback is left alone.
 *
 * The remote request intentionally happens before either local mutation. A
 * rejection therefore leaves the queue and the current playback untouched.
 */
export async function dislikePersonalFmTrack(
  track: SongDetail,
  dependencies: PersonalFmDislikeDependencies,
): Promise<PersonalFmDislikeResult> {
  await dependencies.trash(track.id);

  // Read after the network boundary: the user may have skipped or reordered
  // the FM queue while the request was in flight. Acting on a captured index
  // could remove the wrong track or skip twice.
  const player = dependencies.getPlayer();
  // Personal FM may recommend the same song more than once. Object placement
  // is the strongest identity in the legacy queue until stable queueItemId is
  // persisted, whereas songId alone would confuse two separate rows.
  const queueIndex = player.queue.findIndex((item) => item === track);
  const currentQueueItem = player.queue[player.queueIndex];
  const isCurrentTrack =
    queueIndex >= 0 ? player.queueIndex === queueIndex : currentQueueItem?.id === track.id;

  if (isCurrentTrack) {
    await dependencies.advance("personal-fm-dislike");
    return { status: "advanced" };
  }

  if (queueIndex < 0) return { status: "track-not-in-queue" };

  player.removeQueueItem(queueIndex);
  return { status: "removed" };
}
