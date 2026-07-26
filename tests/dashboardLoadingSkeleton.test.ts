import { expect, test } from "bun:test";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { getDashboardLoadingPlaceholder } from "@/components/shared/DashboardRouteSkeleton";

test("uses the Home page skeleton during dashboard hydration", () => {
  expect(getDashboardLoadingPlaceholder("/")).toBe(HomePageSkeleton);
});

test("uses the playlist page skeleton during dashboard hydration", () => {
  expect(getDashboardLoadingPlaceholder("/playlist")).toBe(PlaylistPageSkeleton);
});

test("keeps the generic dashboard shell as the fallback for other pages", () => {
  expect(getDashboardLoadingPlaceholder("/search")).toBeNull();
});
