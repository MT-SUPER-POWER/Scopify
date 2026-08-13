import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { LoadingSidebarSkeleton } from "@/components/MainLayout/LoadingChrome";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { getDashboardLoadingPlaceholder } from "@/components/shared/DashboardRouteSkeleton";

test("uses the Home page skeleton during dashboard hydration", () => {
  expect(getDashboardLoadingPlaceholder("/")).toBe(HomePageSkeleton);
});

test("uses the playlist page skeleton during dashboard hydration", () => {
  expect(getDashboardLoadingPlaceholder("/playlist")).toBe(PlaylistPageSkeleton);
});

test("does not fake the playlist atmosphere while loading", () => {
  const markup = renderToStaticMarkup(PlaylistPageSkeleton());

  expect(markup).not.toContain("bg-linear-to-b");
});

test("keeps the loading sidebar aligned with the main surface and Scopify brand", () => {
  const markup = renderToStaticMarkup(LoadingSidebarSkeleton());

  expect(markup).toContain("bg-surface-raised");
  expect(markup).toContain(">S</div>");
  expect(markup.match(/items-center justify-center gap-3/g) ?? []).toHaveLength(10);
  expect(markup.match(/lg:justify-start/g) ?? []).toHaveLength(10);
});

test("keeps the generic dashboard shell as the fallback for other pages", () => {
  expect(getDashboardLoadingPlaceholder("/search")).toBeNull();
});
