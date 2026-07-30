import type { ComponentType } from "react";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";

export function getDashboardLoadingPlaceholder(pathname: string): ComponentType | null {
  if (pathname === "/") return HomePageSkeleton;
  if (pathname === "/playlist") return PlaylistPageSkeleton;

  return null;
}
