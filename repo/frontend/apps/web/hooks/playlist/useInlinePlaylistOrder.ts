"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useRef, useState } from "react";
import { usePlaylistOrderMutation } from "@/hooks/playlist/usePlaylistOrderMutation";
import { useUserStore } from "@/store";
import type { InlineOrderDraft } from "@/types/playlistOrder";

export function useInlinePlaylistOrder<T extends { id: number }>(items: T[], playlistId?: string) {
  const mutation = usePlaylistOrderMutation();
  const userId = useUserStore((state) => state.user?.userId);
  const scope = `${userId}:${playlistId ?? "library"}`;
  const [draft, setDraft] = useState<InlineOrderDraft<T> | null>(null);
  const saving = useRef(false);
  const move = (from: number, to: number) => {
    if (saving.current || from === to || !items[from] || !items[to]) return;
    saving.current = true;
    setDraft({ base: items, items: arrayMove(items, from, to), scope });
    void mutation
      .mutateAsync({
        playlistId,
        fromId: items[from].id,
        toId: items[to].id,
        expectedIds: items.map((item) => item.id),
      })
      .catch(() => undefined)
      .finally(() => {
        saving.current = false;
        setDraft(null);
      });
  };
  return {
    items: draft?.base === items && draft.scope === scope ? draft.items : items,
    isSaving: mutation.isPending,
    move,
  };
}
