import type { SubtitlePlayback } from "@/types/subtitle-preview";

export function subtitlePlaybackPosition(
  playback: SubtitlePlayback,
  duration: number,
  loop: boolean,
  now: number,
) {
  const elapsed =
    playback.position + (playback.startedAt === null ? 0 : Math.max(0, now - playback.startedAt));
  const position = loop ? elapsed % (duration + 1200) : elapsed;
  return Math.min(duration, position);
}
