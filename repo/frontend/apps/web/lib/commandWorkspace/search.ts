import type { MusicCapability } from "@scopify/music-domain/capability";
import { musicResourceKey } from "@scopify/music-domain/identity";
import { COMMAND_WORKSPACE_SEARCH_FILTERS } from "@/constants/commandWorkspace";
import { isSearchCategoryAvailable } from "@/lib/search/searchCategory";
import { buildSearchUrl } from "@/lib/search/searchCategory";
import type {
  CommandWorkspaceSearchFilter,
  CommandWorkspaceSearchItem,
} from "@/types/commandWorkspace/model";
import type { Category, SearchResults, SearchRecentEntry } from "@/types/search/model";

export function buildCommandWorkspaceSearchHref(
  keywords: string,
  filter: CommandWorkspaceSearchFilter | null,
) {
  return buildSearchUrl(keywords, filter?.category ?? "All");
}

export function getCommandWorkspaceCategory(filter: CommandWorkspaceSearchFilter | null): Category {
  return filter?.category ?? "All";
}

export function getCommandWorkspaceSearchFilterForCategory(category: Category) {
  return COMMAND_WORKSPACE_SEARCH_FILTERS.find((filter) => filter.category === category) ?? null;
}

export function getCommandWorkspaceSearchItems(
  results: Pick<
    SearchResults,
    "albums" | "artists" | "playlists" | "podcasts" | "songs" | "voices"
  >,
  category: Category,
): CommandWorkspaceSearchItem[] {
  if (category === "Songs") return results.songs.map((entity) => ({ entity, kind: "song" }));
  if (category === "Artists") return results.artists.map((entity) => ({ entity, kind: "artist" }));
  if (category === "Albums") return results.albums.map((entity) => ({ entity, kind: "album" }));
  if (category === "Playlists")
    return results.playlists.map((entity) => ({ entity, kind: "playlist" }));
  if (category === "Podcasts")
    return results.podcasts.map((entity) => ({ entity, kind: "podcast" }));
  if (category === "Voices") return results.voices.map((entity) => ({ entity, kind: "voice" }));

  return [
    ...results.songs.map((entity) => ({ entity, kind: "song" }) as const),
    ...results.artists.map((entity) => ({ entity, kind: "artist" }) as const),
    ...results.albums.map((entity) => ({ entity, kind: "album" }) as const),
    ...results.playlists.map((entity) => ({ entity, kind: "playlist" }) as const),
    ...results.podcasts.map((entity) => ({ entity, kind: "podcast" }) as const),
    ...results.voices.map((entity) => ({ entity, kind: "voice" }) as const),
  ];
}

export function getCommandWorkspaceSearchItemKey(item: CommandWorkspaceSearchItem) {
  return `${item.kind}-${"ref" in item.entity ? musicResourceKey(item.entity.ref) : item.entity.id}`;
}

/** The constraints (`@lyric`, `@mv`, ...) whose content the platform can search. */
export function getAvailableCommandWorkspaceSearchFilters(
  capabilities: ReadonlySet<MusicCapability>,
) {
  return COMMAND_WORKSPACE_SEARCH_FILTERS.filter((filter) =>
    isSearchCategoryAvailable(capabilities, filter.category),
  );
}

/**
 * Whether a result can be opened here. Artists and albums open as track lists read from their
 * own pages, which only platforms with those pages can do.
 */
export function canOpenCommandWorkspaceSearchItem(
  item: CommandWorkspaceSearchItem,
  capabilities: ReadonlySet<MusicCapability>,
) {
  if (item.kind === "artist") return capabilities.has("artist.read");
  if (item.kind === "album") return capabilities.has("album.read");
  return true;
}

export function resolveCommandWorkspaceSearchEntry(
  candidate: SearchRecentEntry | string,
  filter: CommandWorkspaceSearchFilter | null,
): SearchRecentEntry {
  const entry: SearchRecentEntry =
    typeof candidate === "string" ? { category: "All", keyword: candidate } : candidate;
  return { ...entry, category: filter?.category ?? entry.category };
}
