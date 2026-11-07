import type { ComponentType } from "react";
import { PlaylistPageLoadSkeleton } from "@/components/Playlist/PlaylistPageLoadSkeleton";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { ProfilePageSkeleton } from "@/components/profile/ProfilePageSkeleton";

export function getDashboardLoadingPlaceholder(pathname: string): ComponentType | null {
  if (pathname === "/") return HomePageSkeleton;
  if (pathname === "/playlist" || pathname === "/album") return PlaylistPageLoadSkeleton;
  if (pathname === "/profile") return ProfilePageSkeleton;

  return null;
}
