import type { PointerEvent, ReactNode, RefObject } from "react";
import type { LucideIcon } from "lucide-react";
import type {
  CanvasAction,
  CanvasCardVariant,
  CanvasEntry,
  CanvasGroup,
  CanvasJumpTarget,
  CanvasSideConfig,
  CanvasSpacing,
  CardMotion,
} from "@/types/scratchpad/canvas";
import type {
  LocalHistoryEntry,
  ScratchpadCardDensity,
  ScratchpadEntry,
  ScratchpadGroup,
  ScratchpadWorkspaceTab,
} from "@/types/scratchpad/model";

export type ScratchpadSection = Exclude<ScratchpadWorkspaceTab, "overview">;

export interface ScratchpadEmptyProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}

export interface ScratchpadCardProps {
  entry: CanvasEntry;
  slotX: number;
  slotY: number;
  isMoving: boolean;
  isSelected: boolean;
  isFresh: boolean;
  movingCount?: number;
  width: number;
  height: number;
  variant?: CanvasCardVariant;
  currentLabel?: string;
  playLabel: string;
  register: (key: string, motion: CardMotion | null) => void;
  onPointerDown: (entry: CanvasEntry, event: PointerEvent<HTMLDivElement>) => void;
  onPlay: (entry: CanvasEntry) => void;
}

export interface ScratchpadCanvasSideProps {
  mark: import("@/lib/scratchpad/scratchpadLook").ScratchpadShapeKind;
  side: CanvasSideConfig;
  targets: readonly CanvasJumpTarget[];
  scrollRef: RefObject<HTMLDivElement | null>;
  onLocate?: () => void;
}

export interface ScratchpadCanvasProps<E extends CanvasEntry = CanvasEntry> {
  groups: CanvasGroup<E>[];
  freshKeys?: ReadonlySet<string>;
  ariaLabel: string;
  playLabel: string;
  onPlay: (entry: E) => void;
  onMove?: (groupKey: string, keys: string[], targetIndex: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDelete?: (entries: E[]) => void;
  selectionActions: (entries: E[]) => CanvasAction[];
  onEscape?: () => void;
  spacing: CanvasSpacing;
  focusKey?: string;
  variant?: CanvasCardVariant;
  side?: CanvasSideConfig;
  currentLabel?: string;
}

export interface ScratchpadFilterProps {
  searchQuery: string;
  providerFilter: "all" | "netease" | "qq";
  density: ScratchpadCardDensity;
}

export interface ScratchpadOverviewViewProps {
  sheetWidth: number;
  viewHeight: number;
  tilt: number;
  onOpenTab: (tab: Exclude<ScratchpadWorkspaceTab, "overview">) => void;
  onCloseWorkspace: () => void;
}

export interface ScratchpadPanelGroupProps {
  group: ScratchpadGroup;
  currentKey: string | null;
  freshKeys: ReadonlySet<string>;
  onMove: (fromIndex: number, toIndex: number) => void;
  onPlay: (entry: ScratchpadEntry) => void;
  onEnqueueGroup: () => void;
  onSaveGroup: () => void;
  onEnqueueEntry: (entry: ScratchpadEntry) => void;
  onSaveEntry: (entry: ScratchpadEntry) => void;
  onRemoveEntry: (entry: ScratchpadEntry) => void;
}

export interface SortableScratchpadRowProps {
  entry: ScratchpadEntry;
  isActive: boolean;
  isFresh: boolean;
  onPlay: () => void;
  onEnqueue: () => void;
  onSave: () => void;
  onRemove: () => void;
}

export interface HistoryListRowProps {
  entry: LocalHistoryEntry;
  isActive: boolean;
  isCollected: boolean;
  timeLabel: string;
  sourceLabel: string;
  onPlay: () => void;
  onEnqueue: () => void;
  onCollect: () => void;
  onSave: () => void;
  onRemove: () => void;
}

export interface OverviewEntry extends CanvasEntry {
  row: ScratchpadSection;
  sourceKey: string;
}
