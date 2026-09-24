import { create } from "zustand";
import type { FriendsPanelState } from "@/types/privateMessages";

export const useFriendsStore = create<FriendsPanelState>((set) => ({
  ownerId: null,
  drafts: {},
  selectAccount: (ownerId) => set({ ownerId, open: false, peer: null, drafts: {} }),
  setDraft: (peerId, text) => set((state) => ({ drafts: { ...state.drafts, [peerId]: text } })),
  open: false,
  peer: null,
  setOpen: (open) => set({ open }),
  openConversation: (peer) => set({ open: true, peer }),
  back: () => set({ peer: null }),
  reset: () => set({ open: false, peer: null }),
}));
