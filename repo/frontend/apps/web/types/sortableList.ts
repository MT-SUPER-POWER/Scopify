import type { UniqueIdentifier } from "@dnd-kit/core";
import type { ReactNode } from "react";

export interface SortableListProps {
  ids: UniqueIdentifier[];
  disabled?: boolean;
  busy?: boolean;
  canMove?: (from: number, to: number) => boolean;
  onMove: (from: number, to: number) => void;
  renderOverlay: (id: UniqueIdentifier) => ReactNode;
  children: ReactNode;
}

export interface ListInsertionTarget {
  id: UniqueIdentifier;
  placement: "before" | "after";
  index: number;
}

export interface SortableListState {
  available: boolean;
  disabled: boolean;
  activeId: UniqueIdentifier | null;
  insertion: ListInsertionTarget | null;
  landingId: UniqueIdentifier | null;
  landingVersion: number;
  consumeLanding: (version: number) => boolean;
  keyboardDrag: boolean;
}

export interface DragThumbnailProps {
  cover: string;
  title: string;
  subtitle?: string;
}
