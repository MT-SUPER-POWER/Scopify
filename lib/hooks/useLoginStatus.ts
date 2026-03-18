import { useUserStore } from "@/store";

export function useLoginStatus(): boolean {
  const storage = localStorage.getItem('user_id');
  const isLogin = useUserStore((state) => !!state.user?.userId || !!storage);
  return isLogin;
}
