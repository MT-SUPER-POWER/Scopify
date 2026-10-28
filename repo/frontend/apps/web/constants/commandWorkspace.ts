import type { CommandWorkspaceSearchFilter } from "@/types/commandWorkspace/model";
import { CATEGORIES, type Category } from "@/types/search/model";

const SEARCH_FILTERS_BY_CATEGORY = {
  Songs: { category: "Songs", id: "song", label: "歌曲", token: "@song" },
  Artists: { category: "Artists", id: "artist", label: "歌手", token: "@artist" },
  Playlists: { category: "Playlists", id: "playlist", label: "歌单", token: "@playlist" },
  Albums: { category: "Albums", id: "album", label: "专辑", token: "@album" },
  Lyrics: { category: "Lyrics", id: "lyric", label: "歌词", token: "@lyric" },
  Sheets: { category: "Sheets", id: "sheet", label: "乐谱", token: "@sheet" },
  MVs: { category: "MVs", id: "mv", label: "MV", token: "@mv" },
  Podcasts: { category: "Podcasts", id: "podcast", label: "播客", token: "@podcast" },
  Voices: { category: "Voices", id: "episode", label: "声音", token: "@episode" },
} as const satisfies Record<Exclude<Category, "All">, CommandWorkspaceSearchFilter>;

// Keep the picker exhaustive and in the same order as the search-page tabs.
export const COMMAND_WORKSPACE_SEARCH_FILTERS = CATEGORIES.filter(
  (category) => category !== "All",
).map((category) => SEARCH_FILTERS_BY_CATEGORY[category]);

export const COMMAND_WORKSPACE_SEARCH_CATEGORY_HINT = COMMAND_WORKSPACE_SEARCH_FILTERS.map(
  (filter) => filter.label,
).join("、");
