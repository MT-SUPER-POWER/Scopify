"use client";

import { createContext, use, type ReactNode } from "react";
import { useHomeGreeting } from "@/hooks/home/useHomeGreeting";
import { useHomePlaybackActions } from "@/hooks/home/useHomePlaybackActions";
import type { HomeContextValue } from "@/types/home/model";

const HomeContext = createContext<HomeContextValue | null>(null);

export function useHome() {
  const value = use(HomeContext);
  if (!value) throw new Error("useHome must be used within HomeProvider");
  return value;
}

/** 首页各栏目共用：问候语、账号（用于 resetKey）与播放动作。 */
export function HomeProvider({ children }: { children: ReactNode }) {
  const { greeting, dateInfo, accountId } = useHomeGreeting();
  const actions = useHomePlaybackActions();
  return <HomeContext value={{ accountId, actions, dateInfo, greeting }}>{children}</HomeContext>;
}
