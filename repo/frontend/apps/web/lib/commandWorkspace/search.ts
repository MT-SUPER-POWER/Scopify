import { COMMAND_WORKSPACE_SEARCH_FILTERS } from "@/constants/commandWorkspace";
import { buildSearchUrl } from "@/lib/search/searchCategory";
import type {
  CommandWorkspaceSearchFilter,
  CommandWorkspaceSearchItem,
} from "@/types/commandWorkspace";
import type { Category, SearchResults } from "@/types/search";

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
  return `${item.kind}-${item.entity.id}`;
}
