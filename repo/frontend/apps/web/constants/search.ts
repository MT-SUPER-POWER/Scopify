import type { MusicCapability } from "@scopify/music-domain/capability";

import type { Category } from "@/types/search/model";

/**
 * The capability a search tab needs on top of `search`. Songs, artists, albums and playlists
 * need nothing more; the others search content only some platforms have.
 */
export const SEARCH_CATEGORY_CAPABILITIES: Partial<Record<Category, MusicCapability>> = {
  Lyrics: "search.lyrics",
  Sheets: "track.sheet",
  MVs: "mv",
  Podcasts: "podcast",
  Voices: "podcast",
};
