"use client";

import { createContext } from "react";
import type { SortableListState } from "@/types/tracklist/sortableList";

export const SortableListContext = createContext<SortableListState | null>(null);
