export type MusicSessionSameSite = "lax" | "no_restriction" | "strict" | "unspecified";

/** One cookie record normalized from a Cookie or aggregated Set-Cookie string. */
export interface MusicSessionCookie {
  expiresAt?: number;
  httpOnly: boolean;
  maxAge?: number;
  name: string;
  path: string;
  sameSite?: MusicSessionSameSite;
  secure?: boolean;
  value: string;
}
