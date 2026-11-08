export type MusicProvider = "netease" | "qq";
export type MusicResourceKind = "track" | "album" | "artist" | "playlist";

/** A durable resource reference, independent of the current account or playback URL. */
export interface MusicResourceRef<Kind extends MusicResourceKind = MusicResourceKind> {
  provider: MusicProvider;
  kind: Kind;
  id: string;
}

/** Account identity only. Tokens, cookies and deployment configuration stay in the host. */
export interface MusicAccountRef {
  provider: MusicProvider;
  accountId: string;
}

/** Structured encoding avoids collisions even when a native ID contains punctuation. */
export function musicResourceKey(ref: MusicResourceRef): string {
  return JSON.stringify([ref.provider, ref.kind, ref.id]);
}

export function musicAccountKey(account: MusicAccountRef): string {
  return JSON.stringify([account.provider, account.accountId]);
}
