import type { MusicProvider } from "@scopify/music-domain/identity";

/**
 * Query keys for migrated areas start with the platform, so the same native ID on two
 * platforms never shares a cache entry. Keys not yet migrated are NetEase-only.
 */
export function providerQueryKey<const Key extends readonly unknown[]>(
  provider: MusicProvider,
  ...key: Key
) {
  return [provider, ...key] as const;
}
