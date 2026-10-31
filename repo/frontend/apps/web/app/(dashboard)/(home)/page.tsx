"use client";

import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { useRouteRestorationPlaceholder } from "@/components/shared/NavigationScrollProvider";

/** 首页内容全在 slot 里；这里只负责滚动恢复时的骨架占位。 */
export default function HomePage() {
  useRouteRestorationPlaceholder(HomePageSkeleton);
  return null;
}
