import { useUserStore } from "@/store";

export function useLoginStatus(): boolean {
  const userStore = useUserStore.getState();
  if (userStore.user && userStore.cookie !== '') return true;
  return false;
}
