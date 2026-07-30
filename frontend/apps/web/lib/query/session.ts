export const MUSIC_SESSION_EXPIRED_EVENT = "scopify:music-session-expired";

export function notifyExpiredMusicSession() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MUSIC_SESSION_EXPIRED_EVENT));
}
