"use client";

import { HomeContent } from "@/components/home/HomeContent";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { useRouteRestorationPlaceholder } from "@/components/shared/NavigationScrollProvider";

export default function HomePage() {
  useRouteRestorationPlaceholder(HomePageSkeleton);
  return <HomeContent />;
}
