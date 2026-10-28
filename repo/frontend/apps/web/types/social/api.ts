/** Untrusted JSON payloads are decoded in lib/social/normalize. */
export type SocialRawObject = Record<string, unknown>;
export interface SocialRawResponse extends SocialRawObject {
  code: number;
}
export type SocialRequestParams = Record<string, string | number | boolean | undefined>;
