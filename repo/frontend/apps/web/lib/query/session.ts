export const MUSIC_SESSION_EXPIRED_EVENT = "scopify:music-session-expired";
export const QQ_SESSION_EXPIRED_EVENT = "scopify:qq-session-expired";

export function notifyExpiredMusicSession() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MUSIC_SESSION_EXPIRED_EVENT));
}

/** The QQ session was rejected; only the QQ account is signed out, NetEase's is kept. */
export function notifyExpiredQqSession() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(QQ_SESSION_EXPIRED_EVENT));
}
