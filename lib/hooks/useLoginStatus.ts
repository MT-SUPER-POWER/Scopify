import { useUserStore } from "@/store";

export function useLoginStatus(): boolean {
  const userStore = useUserStore.getState();
  if (userStore.cookie || userStore.cookie !== '') return true;
  return false;
}
