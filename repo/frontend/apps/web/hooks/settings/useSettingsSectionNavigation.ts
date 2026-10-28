"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useNavigationScroll } from "@/components/shared/NavigationScrollProvider";
import { parseSettingsTab } from "@/lib/settings/tabs";
import type { SettingsTabId } from "@/types/settings/model";

/** Resolve settings anchors only after the requested tab and its content are mounted. */
export function useSettingsSectionNavigation(activeTab: SettingsTabId, ready: boolean) {
  const searchParams = useSearchParams();
  const queryTab = parseSettingsTab(searchParams.get("tab") ?? undefined);
  const { entryId, isRestoring, scrollElement } = useNavigationScroll();

  useEffect(() => {
    if (!ready || activeTab !== queryTab || !scrollElement || isRestoring) return;

    let frame: number | null = null;
    const scheduleScroll = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        let id: string;
        try {
          id = decodeURIComponent(window.location.hash.slice(1));
        } catch {
          return;
        }
        if (!id) return;
        const target = document.getElementById(id);
        if (!target || !scrollElement.contains(target)) return;

        // Scroll only the route viewport, keeping the app shell in place.
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        scrollElement.scrollTo({
          top:
            scrollElement.scrollTop +
            target.getBoundingClientRect().top -
            scrollElement.getBoundingClientRect().top -
            margin,
          behavior: "instant",
        });
      });
    };

    scheduleScroll();
    window.addEventListener("hashchange", scheduleScroll);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", scheduleScroll);
    };
  }, [activeTab, entryId, isRestoring, queryTab, ready, scrollElement]);
}
