"use client";

import { createContext } from "react";
import type { SortableListState } from "@/types/sortableList";

export const SortableListContext = createContext<SortableListState | null>(null);
