// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { vipSign, vipSignDetail, vipSignHistory } from "@/lib/api/user";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { getMusicSessionCredential } from "@/lib/web/musicSessionCredential";
import { getVipSignTodayRecord, hasVipSignedToday } from "@/lib/vipSign";
import { useUserStore } from "@/store";
import type { VipSignDetail, VipSignHistoryResponse } from "@/types/api/vipSign";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ QUERY KEYS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const vipSignKeys = {
  all: ["vipSign"] as const,
  history: (userId: number | undefined) => [...vipSignKeys.all, "history", userId] as const,
};

function getVipSignErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "businessMsg" in error) {
    return typeof error.businessMsg === "string" ? error.businessMsg : "";
  }

  return error instanceof Error ? error.message : "";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HOOK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useVipSign() {
  const isLoggedIn = useLoginStatus();
  const queryClient = useQueryClient();
  const userId = useUserStore((state) => state.user?.userId);

  const getCookie = useCallback(() => {
    return getMusicSessionCredential();
  }, []);

  // ─────────────────────────────────────────────────────────
  // /vip/sign/history?type=1 返回七日月历，sign 是当天的权威签到状态。
  // ─────────────────────────────────────────────────────────
  const { data: signHistory, isLoading } = useQuery<VipSignHistoryResponse>({
    queryKey: vipSignKeys.history(userId),
    queryFn: async () => {
      const cookie = getCookie();
      const res = await vipSignHistory(cookie);
      return res.data;
    },
    enabled: isLoggedIn && userId !== undefined,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const signRecords = useMemo(() => signHistory?.data.signInfoList ?? [], [signHistory]);

  const todayRecord = useMemo(() => getVipSignTodayRecord(signRecords), [signRecords]);
  const hasSignedToday = useMemo(() => hasVipSignedToday(signRecords), [signRecords]);

  // ─────────────────────────────────────────────────────────
  // 已签到时以日历中的 signTime 获取只读详情，避免再次触发签到。
  // ─────────────────────────────────────────────────────────
  const fetchSignDetail = useCallback(
    async (signTime: number): Promise<VipSignDetail | undefined> => {
      if (!signTime) return undefined;

      try {
        const cookie = getCookie();
        const res = await vipSignDetail(signTime, cookie);
        return res.data.data;
      } catch {
        return undefined;
      }
    },
    [getCookie],
  );

  const fetchTodayRecord = useCallback(() => {
    return fetchSignDetail(todayRecord?.signTime ?? 0);
  }, [fetchSignDetail, todayRecord?.signTime]);

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
      await queryClient.refetchQueries({ queryKey: vipSignKeys.history(userId) });
      if (data.signed) {
        toast.success(data.message || "签到成功");
      } else {
        toast.info("今日已签到");
      }
    },
    onError: async (error) => {
      const msg = getVipSignErrorMessage(error);
      if (msg.includes("已经") || msg.includes("重复")) {
        await queryClient.refetchQueries({ queryKey: vipSignKeys.history(userId) });
        toast.info("今日已签到");
      } else {
        toast.error(msg || "签到失败");
      }
    },
  });

  return {
    /** /vip/sign/history?type=1 的当天记录已签到状态 */
    hasSignedToday,
    /** 乐签日历状态 */
    signHistory: signHistory?.data,
    /** /vip/sign/history 加载中 */
    isLoading,
    /** GET /vip/sign/detail：获取已签到当天的 Modal 展示数据 */
    fetchTodayRecord,
    /** GET /vip/sign/detail：获取指定已签到日期的 Modal 展示数据 */
    fetchSignDetail,
    /** POST /vip/sign：执行签到（含 toast + 刷新 info 缓存） */
    doSign: signMutation,
    /** 签到进行中 */
    isSigning,
  };
}
