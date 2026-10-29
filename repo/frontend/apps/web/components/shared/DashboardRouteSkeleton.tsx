import type { ComponentType } from "react";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { ProfilePageSkeleton } from "@/components/profile/ProfilePageSkeleton";

export function getDashboardLoadingPlaceholder(pathname: string): ComponentType | null {
  if (pathname === "/") return HomePageSkeleton;
  if (pathname === "/playlist") return PlaylistPageSkeleton;
  if (pathname === "/profile") return ProfilePageSkeleton;

  return null;
}
