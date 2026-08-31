import type { SongDetail } from "@/types/api/music";
import type { Album, Artist, Category, Playlist, Podcast, Song, Voice } from "@/types/search";
import type { DragEvent, KeyboardEvent, RefObject } from "react";
import type { LucideIcon } from "lucide-react";
import type { ShortcutBinding, ShortcutCommandId } from "@/types/shortcuts";
import type { SearchRecentEntry } from "@/types/search";

export type CommandWorkspacePage =
  "root" | "search" | "queue" | "now-playing" | "settings" | "track-list";
export type CommandWorkspaceRootPage = Exclude<CommandWorkspacePage, "root" | "track-list">;
export type CommandWorkspaceUsageCounts = Partial<Record<CommandWorkspaceRootPage, number>>;

export interface CommandWorkspaceSettingsProps {
  onClose(): void;
}

export interface CommandWorkspaceSettingsItem {
  action(): void;
  icon: LucideIcon;
  id: string;
  label: string;
  shortcutId?: ShortcutCommandId;
  summary: string;
}

export interface UseCommandWorkspaceNavigationOptions {
  onBack(): void;
  onRoot(): void;
  onToggleHelp(): void;
}

export interface CommandWorkspaceRootProps {
  onClose(): void;
  onLeaveCommand(): void;
  onOpenPage(page: CommandWorkspaceRootPage): void;
}

export interface CommandWorkspaceRootItem {
  binding?: ShortcutBinding;
  id: string;
  label: string;
  page?: CommandWorkspaceRootPage;
  summary: string;
  type: "shortcut" | "workspace";
  usageCount: number;
}

export interface CommandWorkspaceRootListProps {
  items: CommandWorkspaceRootItem[];
  onSelect(item: CommandWorkspaceRootItem, index: number): void;
  selectedIndex: number;
}

export interface CommandWorkspaceCommandProps {
  onClose(): void;
  onLeaveCommand(): void;
}

export interface CommandWorkspaceDirectSearchProps {
  initialQuery: string;
  onClose(): void;
  onEnterCommand(): void;
}

export interface CommandWorkspaceDirectSearchResultsProps {
  isLoading: boolean;
  onClearRecent(): void;
  onRemoveRecent(item: SearchRecentEntry): void;
  onSubmit(candidate: SearchRecentEntry | string): void;
  query: string;
  recent: SearchRecentEntry[];
  selectedIndex: number;
  suggestions: CommandWorkspaceSearchSuggestion[];
}

export interface CommandWorkspaceFilterPickerProps {
  filters: CommandWorkspaceSearchFilter[];
  onChoose(filter: CommandWorkspaceSearchFilter): void;
  selectedIndex: number;
}

export interface CommandWorkspaceHelpProps {
  page: CommandWorkspacePage;
}

export interface CommandWorkspaceIconProps {
  id: string;
}

export interface CommandWorkspaceQueryInputProps {
  autoFocus?: boolean;
  filter: CommandWorkspaceSearchFilter | null;
  inputRef?: RefObject<HTMLInputElement | null>;
  onFilterChange(filter: CommandWorkspaceSearchFilter | null): void;
  onKeyDown?(event: KeyboardEvent<HTMLInputElement>): void;
  onQueryChange(query: string): void;
  placeholder: string;
  query: string;
}

export interface CommandWorkspaceRecentSearchRowProps {
  item: SearchRecentEntry;
  onRemove(item: SearchRecentEntry): void;
  onSubmit(item: SearchRecentEntry): void;
  selected: boolean;
}

export interface CommandWorkspaceRootInputProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onChange(query: string): void;
  onKeyDown(event: KeyboardEvent<HTMLInputElement>): void;
  query: string;
}

export interface CommandWorkspaceModalProps {
  isOpen: boolean;
  onClose(): void;
}

export interface CommandWorkspaceQueueProps {
  onClose?(): void;
}

export interface CommandWorkspaceQueueDropTarget {
  index: number;
  placement: "after" | "before";
}

export interface CommandWorkspaceQueueItemProps {
  index: number;
  isCurrent: boolean;
  isCurrentPlaying: boolean;
  isDragging: boolean;
  isTargetAfter: boolean;
  isTargetBefore: boolean;
  onDragEnd(): void;
  onDragOver(event: DragEvent<HTMLDivElement>, index: number): void;
  onDragStart(event: DragEvent<HTMLDivElement>, index: number): void;
  onDrop(event: DragEvent<HTMLDivElement>, index: number): void;
  onNavigateAlbum(albumId: number): void;
  onNavigateArtist(artistId: number): void;
  onPlay(index: number): void;
  onRemove(index: number): void;
  track: SongDetail;
}

export interface CommandWorkspaceQueueItemMenuProps {
  index: number;
  onNavigateAlbum(albumId: number): void;
  onNavigateArtist(artistId: number): void;
  onRemove(index: number): void;
  track: SongDetail;
}

export interface CommandWorkspaceQueueItemMetadataProps {
  index: number;
  isCurrent: boolean;
  onNavigateAlbum(albumId: number): void;
  onNavigateArtist(artistId: number): void;
  onPlay(index: number): void;
  track: SongDetail;
}

export interface CommandWorkspaceSearchProps {
  onOpenTrackList(item: CommandWorkspaceSearchItem): void;
}

export interface CommandWorkspaceSearchResultListProps {
  items: CommandWorkspaceSearchItem[];
  onAppend(item: CommandWorkspaceSearchItem): void;
  onInsertNext(item: CommandWorkspaceSearchItem): void;
  onSelect(item: CommandWorkspaceSearchItem): void;
  selectedIndex: number;
}

export interface CommandWorkspaceTrackListProps {
  onAppend(track: SongDetail): void;
  onInsertNext(track: SongDetail): void;
  onPlay(index: number): void;
  trackList: CommandWorkspaceTrackList;
}

export interface CommandWorkspaceNowPlayingProps {
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
