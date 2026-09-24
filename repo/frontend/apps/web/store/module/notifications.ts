import { create } from "zustand";
import type { NotificationUiState } from "@/types/notifications";

export const useNotificationStore = create<NotificationUiState>((set) => ({
  accountId: null,
  snapshot: null,
  localError: false,
  pending: false,
  selectAccount: (accountId) => set({ accountId, snapshot: null, localError: false }),
  accept: (snapshot) =>
    set((state) => (state.accountId === snapshot.accountId ? { snapshot } : {})),
}));
