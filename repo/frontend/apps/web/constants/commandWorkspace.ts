import type { CommandWorkspaceSearchFilter } from "@/types/commandWorkspace";

export const COMMAND_WORKSPACE_SEARCH_FILTERS = [
  { category: "Songs", id: "song", label: "歌曲", token: "@song" },
  { category: "Artists", id: "artist", label: "歌手", token: "@artist" },
  { category: "Albums", id: "album", label: "专辑", token: "@album" },
  { category: "Playlists", id: "playlist", label: "歌单", token: "@playlist" },
  { category: "Podcasts", id: "podcast", label: "播客", token: "@podcast" },
  { category: "Voices", id: "episode", label: "节目", token: "@episode" },
] as const satisfies readonly CommandWorkspaceSearchFilter[];
