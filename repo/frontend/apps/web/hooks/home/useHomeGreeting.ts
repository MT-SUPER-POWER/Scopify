"use client";

import { useEffect } from "react";
import { useHomeUserProfileQuery } from "@/hooks/home/useHomeQueries";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { getHomeGreetingKey } from "@/lib/home/greeting";
import { useUserStore } from "@/store";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";

export function useHomeGreeting() {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const account = useActiveAccount();
  const isLogin = account.isLoggedIn;
  const user = useUserStore((state) => state.user);
  // The NetEase profile is fetched to complete a session restored from storage; other
  // platforms report their own profile with the account.
  const storedUserId =
    isLogin &&
    account.provider === "netease" &&
    (!user?.nickname || !user.userId) &&
    typeof window !== "undefined"
      ? window.localStorage.getItem("user_id")
      : null;
  const profile = useHomeUserProfileQuery(storedUserId).data?.profile;
  useEffect(() => {
    if (!profile) return;
    const store = useUserStore.getState();
    store.setUser(profile);
    store.setUserId(profile.userId);
  }, [profile]);
  const name = account.provider === "netease" ? user?.nickname : account.profile?.nickname;
  const validName = isLogin && name?.trim() && name !== t("common.meta.unknownUser");
  const greeting = t(getHomeGreetingKey());
  const today = new Date();
  const accountId =
    account.provider === "netease"
      ? String(user?.userId ?? "")
      : (account.profile?.accountId ?? "");
  return {
    greeting: validName ? `${greeting}, ${name}` : greeting,
    accountId: isLogin ? `${account.provider}:${accountId}` : "anonymous",
    dateInfo: {
      dayOfWeek: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(today),
      dateNum: today.getDate(),
    },
  };
}
