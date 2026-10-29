"use client";

import { useState } from "react";

import type { DailyCategoryConfigUpdate } from "@/types/playlist/api";

/** A draft belongs to one category, so tags from different categories cannot be submitted together. */
export function useDailyCategorySelection() {
  const [draft, setDraft] = useState<DailyCategoryConfigUpdate | null>(null);

  function beginSelection(category: number, tags: number[]) {
    setDraft({ category, tags: [...tags] });
  }

  function toggleTag(category: number, tag: number) {
    setDraft((current) => {
      if (!current || current.category !== category) return current;
      return {
        ...current,
        tags: current.tags.includes(tag)
          ? current.tags.filter((id) => id !== tag)
          : [...current.tags, tag],
      };
    });
  }

  function cancelSelection() {
    setDraft(null);
  }

  return { draft, beginSelection, toggleTag, cancelSelection };
}
