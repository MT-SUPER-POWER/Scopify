import type { PointerEvent, RefObject } from "react";
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
import type { ScratchpadCardDensity, ScratchpadWorkspaceTab } from "@/types/scratchpad/model";

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
  onOpenTab: (tab: Exclude<ScratchpadWorkspaceTab, "overview">) => void;
  onCloseWorkspace: () => void;
}
