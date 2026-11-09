"use client";

import type { MusicTrack } from "@scopify/music-domain/track";
import { arrayMove } from "@dnd-kit/sortable";
import { useRef, useState } from "react";
import { usePlaylistOrderMutation } from "@/hooks/playlist/usePlaylistOrderMutation";
import { useUserStore } from "@/store";
import type { InlineOrderDraft } from "@/types/playlist/order";

/** Library playlists carry their NetEase ID; playlist tracks carry a reference. */
type InlineOrderItem = { id: number } | MusicTrack;

/** The ID the NetEase order endpoints take. Only NetEase lists can be reordered. */
function orderIdOf(item: InlineOrderItem) {
  return "ref" in item ? Number(item.ref.id) : item.id;
}

export function useInlinePlaylistOrder<T extends InlineOrderItem>(items: T[], playlistId?: string) {
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
        fromId: orderIdOf(items[from]),
        toId: orderIdOf(items[to]),
        expectedIds: items.map(orderIdOf),
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
