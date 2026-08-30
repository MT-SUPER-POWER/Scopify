import type { SongDetail } from "@/types/api/music";
import type { Album, Artist, Category, Playlist, Podcast, Song, Voice } from "@/types/search";

export type CommandWorkspacePage =
  "root" | "search" | "queue" | "now-playing" | "settings" | "track-list";
export type CommandWorkspaceRootPage = Exclude<CommandWorkspacePage, "root" | "track-list">;
export type CommandWorkspaceUsageCounts = Partial<Record<CommandWorkspaceRootPage, number>>;

export interface CommandWorkspaceSettingsProps {
  onClose(): void;
}

export interface CommandWorkspaceQueueProps {
  onClose?(): void;
}

export type CommandWorkspaceFilterId =
  "song" | "artist" | "album" | "playlist" | "podcast" | "episode";

export interface CommandWorkspaceSearchFilter {
  category: Exclude<Category, "All">;
  id: CommandWorkspaceFilterId;
  label: string;
  token: `@${CommandWorkspaceFilterId}`;
}

export type CommandWorkspaceSearchItem =
  | { entity: Album; kind: "album" }
  | { entity: Artist; kind: "artist" }
  | { entity: Playlist; kind: "playlist" }
  | { entity: Podcast; kind: "podcast" }
  | { entity: Song; kind: "song" }
  | { entity: Voice; kind: "voice" };

export interface CommandWorkspaceTrackList {
  description?: string;
  title: string;
  tracks: SongDetail[];
}

export interface CommandWorkspaceSearchSuggestion {
  keyword: string;
}
