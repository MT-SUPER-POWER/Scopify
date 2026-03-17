import { useUserStore } from "@/store";

export function useLoginStatus(): boolean {
  const isLogin = useUserStore((state) => !!state.user?.userId);
  return isLogin;
}
