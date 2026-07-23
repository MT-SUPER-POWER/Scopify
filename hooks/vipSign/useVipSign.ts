// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { vipSign, vipSignInfo } from "@/lib/api/user";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import type { VipSignDetail, VipSignInfoResponse, VipSignResponse } from "@/types/api/vipSign";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ QUERY KEYS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const vipSignKeys = {
  all: ["vipSign"] as const,
  info: () => [...vipSignKeys.all, "info"] as const,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HOOK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useVipSign() {
  const isLoggedIn = useLoginStatus();
  const queryClient = useQueryClient();

  const getCookie = useCallback(() => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem("music_cookie") ?? undefined;
  }, []);

  // ─────────────────────────────────────────────────────────
  // /vip/sign/info → 仅用于判断今天是否已签到（按钮状态）
  // ─────────────────────────────────────────────────────────
  const { data: signInfo, isLoading } = useQuery<VipSignInfoResponse>({
    queryKey: vipSignKeys.info(),
    queryFn: async () => {
      const cookie = getCookie();
      const res = await vipSignInfo(cookie);
      return res.data;
    },
    enabled: isLoggedIn,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const signRecords = useMemo(() => signInfo?.data ?? [], [signInfo]);

  const hasSignedToday = useMemo(() => {
    return signRecords.some((r) => r.today === true);
  }, [signRecords]);

  // ─────────────────────────────────────────────────────────
  // POST /vip/sign → Modal 数据的唯一来源
  // 无论签没签过，调这个接口都能拿到 checkinDetail.data
  // ─────────────────────────────────────────────────────────
  const fetchTodayRecord = useCallback(async (): Promise<VipSignDetail | undefined> => {
    try {
      const cookie = getCookie();
      const res = await vipSign(cookie);
      const apiData = res.data;
      return apiData.checkinDetail?.data;
    } catch {
      return undefined;
    }
  }, [getCookie]);

  // ─────────────────────────────────────────────────────────
  // 签到 mutation（调用 POST /vip/sign）
  // 签到成功后刷新 /vip/sign/info 缓存，更新按钮状态
  // ─────────────────────────────────────────────────────────
  const { mutateAsync: signMutation, isPending: isSigning } = useMutation({
    mutationFn: async () => {
      const cookie = getCookie();
      const res = await vipSign(cookie);
      return res.data;
    },
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ queryKey: vipSignKeys.info() });
      if (data.signed) {
        toast.success(data.message || "签到成功");
      } else {
        toast.info("今日已签到");
      }
    },
    onError: async (error: any) => {
      const msg = error?.businessMsg || error?.message || "";
      if (msg.includes("已经") || msg.includes("重复")) {
        await queryClient.refetchQueries({ queryKey: vipSignKeys.info() });
        toast.info("今日已签到");
      } else {
        toast.error(msg || "签到失败");
      }
    },
  });

  return {
    /** /vip/sign/info 判断：今天是否已签到 */
    hasSignedToday,
    /** /vip/sign/info 判断：加载中 */
    isLoading,
    /** POST /vip/sign：获取 Modal 展示数据 */
    fetchTodayRecord,
    /** POST /vip/sign：执行签到（含 toast + 刷新 info 缓存） */
    doSign: signMutation,
    /** 签到进行中 */
    isSigning,
  };
}
