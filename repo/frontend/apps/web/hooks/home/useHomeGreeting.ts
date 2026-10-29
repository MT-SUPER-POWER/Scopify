"use client";

import { useEffect } from "react";
import { useHomeUserProfileQuery } from "@/hooks/home/useHomeQueries";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { getHomeGreetingKey } from "@/lib/home/greeting";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

export function useHomeGreeting() {
  const { t, locale } = useI18n();
  const isLogin = useLoginStatus();
  const user = useUserStore((state) => state.user);
  const storedUserId =
    isLogin && (!user?.nickname || !user.userId) && typeof window !== "undefined"
      ? window.localStorage.getItem("user_id")
      : null;
  const profile = useHomeUserProfileQuery(storedUserId).data?.profile;
  useEffect(() => {
    if (!profile) return;
    const store = useUserStore.getState();
    store.setUser(profile);
    store.setUserId(profile.userId);
  }, [profile]);
  const name = user?.nickname;
  const validName = isLogin && name?.trim() && name !== t("common.meta.unknownUser");
  const greeting = t(getHomeGreetingKey());
  const today = new Date();
  return {
    greeting: validName ? `${greeting}, ${name}` : greeting,
    accountId: isLogin ? String(user?.userId ?? "") : "anonymous",
    dateInfo: {
      dayOfWeek: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(today),
      dateNum: today.getDate(),
    },
  };
}
